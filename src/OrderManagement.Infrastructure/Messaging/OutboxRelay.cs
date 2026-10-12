using System.Data;
using System.Globalization;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using OrderManagement.Domain.Orders;
using OrderManagement.Infrastructure.Persistence;

namespace OrderManagement.Infrastructure.Messaging;

public sealed class OutboxRelay(
    IServiceScopeFactory scopes,
    ILogger<OutboxRelay> logger) : BackgroundService
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);
    private static readonly TimeSpan IdleDelay = TimeSpan.FromMilliseconds(500);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var published = await DispatchAsync(stoppingToken);
                if (published == 0)
                {
                    await Task.Delay(IdleDelay, stoppingToken);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Outbox relay failed. Retrying.");
                await Task.Delay(TimeSpan.FromSeconds(2), stoppingToken);
            }
        }
    }

    private async Task<int> DispatchAsync(CancellationToken cancellationToken)
    {
        await using var scope = scopes.CreateAsyncScope();
        var database = scope.ServiceProvider.GetRequiredService<OrdersDbContext>();
        var created = scope.ServiceProvider.GetRequiredService<IOrderCreatedPublisher>();
        var statusChanged = scope.ServiceProvider.GetRequiredService<IOrderStatusChangedPublisher>();
        await using var transaction = await database.Database.BeginTransactionAsync(cancellationToken);
        var pending = await LockPendingAsync(database, cancellationToken);
        foreach (var message in pending)
        {
            await PublishAsync(created, statusChanged, message, cancellationToken);
        }

        if (pending.Count > 0)
        {
            var publishedAt = BrazilTime.Now().ToString("yyyy-MM-dd HH:mm:ss.fff", CultureInfo.InvariantCulture);
            foreach (var message in pending)
            {
                await database.Database.ExecuteSqlInterpolatedAsync(
                    $"""
                    UPDATE outbox_messages
                    SET published_at = CAST({publishedAt} AS timestamp without time zone)
                    WHERE id = {message.Id}
                    """,
                    cancellationToken);
            }
        }

        await transaction.CommitAsync(cancellationToken);
        return pending.Count;
    }

    private async Task PublishAsync(
        IOrderCreatedPublisher created,
        IOrderStatusChangedPublisher statusChanged,
        PendingOutbox message,
        CancellationToken cancellationToken)
    {
        if (message.EventType == OrderCreatedMessage.EventName)
        {
            var body = JsonSerializer.Deserialize<OrderCreatedMessage>(message.Payload, Json);
            if (body is null || body.OrderId == Guid.Empty)
            {
                throw new InvalidOperationException("Outbox order message is unreadable.");
            }

            await created.PublishAsync(body, cancellationToken);
            return;
        }

        if (message.EventType == OrderStatusChangedMessage.EventName)
        {
            var body = JsonSerializer.Deserialize<OrderStatusChangedMessage>(message.Payload, Json);
            if (body is null || body.OrderId == Guid.Empty)
            {
                throw new InvalidOperationException("Outbox status message is unreadable.");
            }

            await statusChanged.PublishAsync(body, cancellationToken);
            return;
        }

        logger.LogWarning(
            "Outbox message {OutboxId} has unknown event {EventType} and will be marked published.",
            message.Id,
            message.EventType);
    }

    private static async Task<List<PendingOutbox>> LockPendingAsync(
        OrdersDbContext database,
        CancellationToken cancellationToken)
    {
        var connection = database.Database.GetDbConnection();
        if (connection.State != ConnectionState.Open)
        {
            await connection.OpenAsync(cancellationToken);
        }

        await using var command = connection.CreateCommand();
        command.Transaction = database.Database.CurrentTransaction?.GetDbTransaction();
        command.CommandText =
            """
            SELECT id, event_type, payload
            FROM outbox_messages
            WHERE published_at IS NULL
            ORDER BY created_at
            LIMIT 20
            FOR UPDATE SKIP LOCKED
            """;

        var pending = new List<PendingOutbox>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            pending.Add(new PendingOutbox(reader.GetGuid(0), reader.GetString(1), reader.GetString(2)));
        }

        return pending;
    }

    private sealed record PendingOutbox(Guid Id, string EventType, string Payload);
}
