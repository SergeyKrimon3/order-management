using System.Text.Json;
using Microsoft.Extensions.Logging;
using OrderManagement.Domain.Orders;
using RabbitMQ.Client;

namespace OrderManagement.Infrastructure.Messaging;

public sealed class RabbitMqOrderStatusChangedPublisher(
    RabbitMqOptions options,
    ILogger<RabbitMqOrderStatusChangedPublisher> logger) : IOrderStatusChangedPublisher, IAsyncDisposable
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly SemaphoreSlim gate = new(1, 1);
    private IConnection? connection;

    public async Task PublishAsync(OrderStatusChangedMessage message, string? traceParent, CancellationToken cancellationToken)
    {
        var body = JsonSerializer.SerializeToUtf8Bytes(message, JsonOptions);
        var headers = new Dictionary<string, object?>();
        OrderActivity.ApplyHeader(headers, traceParent);
        var properties = new BasicProperties
        {
            Persistent = true,
            ContentType = "application/json",
            CorrelationId = message.OrderId.ToString(),
            Type = message.EventType,
            Headers = headers
        };

        await gate.WaitAsync(cancellationToken);
        try
        {
            var current = await ConnectAsync(cancellationToken);
            await using var channel = await current.CreateChannelAsync(new CreateChannelOptions(false, false), cancellationToken);
            await RabbitMqClient.DeclareQueueAsync(channel, options.StatusQueue, cancellationToken);
            await channel.BasicPublishAsync(
                exchange: string.Empty,
                routingKey: options.StatusQueue,
                mandatory: false,
                basicProperties: properties,
                body: body,
                cancellationToken: cancellationToken);
            logger.LogInformation(
                "Published {EventType} for order {OrderId} with status {Status}.",
                message.EventType,
                message.OrderId,
                message.Status);
        }
        finally
        {
            gate.Release();
        }
    }

    public async ValueTask DisposeAsync()
    {
        if (connection is not null)
        {
            await connection.DisposeAsync();
        }

        gate.Dispose();
    }

    private async Task<IConnection> ConnectAsync(CancellationToken cancellationToken)
    {
        if (connection is { IsOpen: true })
        {
            return connection;
        }

        if (connection is not null)
        {
            await connection.DisposeAsync();
        }

        var factory = RabbitMqClient.CreateFactory(options, "order-management-status");
        connection = await factory.CreateConnectionAsync(cancellationToken);
        return connection;
    }
}
