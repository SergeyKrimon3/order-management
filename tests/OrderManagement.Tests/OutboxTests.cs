using System.Text.Json;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using OrderManagement.Domain.Orders;
using OrderManagement.Infrastructure.Messaging;
using OrderManagement.Infrastructure.Orders;
using OrderManagement.Infrastructure.Persistence;

namespace OrderManagement.Tests;

public class OutboxTests
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    [Fact]
    public async Task Create_WritesTheOrderAndTheMessageInOneTransaction()
    {
        await using var database = await CreateDatabaseAsync();
        var service = new OrderService(database);

        var order = await service.CreateAsync("Ada Lovelace", "Teclado", 150.5m, null, null, CancellationToken.None);

        var storedOrder = await database.Orders.SingleAsync(item => item.Id == order.Id);
        var message = await database.OutboxMessages.SingleAsync();
        var payload = JsonSerializer.Deserialize<OrderCreatedMessage>(message.Payload, Json);
        Assert.Equal(order.Id, storedOrder.Id);
        Assert.Equal(OrderCreatedMessage.EventName, message.EventType);
        Assert.Equal(order.Id, message.CorrelationId);
        Assert.Null(message.PublishedAt);
        Assert.NotNull(payload);
        Assert.Equal(order.Id, payload.OrderId);
        Assert.Equal(order.Id, payload.CorrelationId);
        var history = await database.OrderStatusChanges.SingleAsync(change => change.OrderId == order.Id);
        Assert.Equal(OrderStatus.Pending, history.Status);
        Assert.Equal(order.CreatedAt, history.OccurredAt);
    }

    [Fact]
    public async Task Create_RollsBackTheOrderAndTheMessageTogether()
    {
        await using var database = await CreateDatabaseAsync();
        var service = new OrderService(database);
        var before = await database.Orders.CountAsync();
        await using var transaction = await database.Database.BeginTransactionAsync();

        var order = await service.CreateAsync("Ada Lovelace", "Teclado", 150.5m, null, null, CancellationToken.None);
        await transaction.RollbackAsync();

        Assert.Equal(before, await database.Orders.CountAsync());
        Assert.False(await database.Orders.AnyAsync(item => item.Id == order.Id));
        Assert.Empty(await database.OutboxMessages.ToListAsync());
        Assert.Empty(await database.OrderStatusChanges.ToListAsync());
    }

    private static async Task<OrdersDbContext> CreateDatabaseAsync()
    {
        var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        var options = new DbContextOptionsBuilder<OrdersDbContext>()
            .UseSqlite(connection)
            .Options;
        var database = new OrdersDbContext(options);
        await database.Database.EnsureCreatedAsync();
        return database;
    }
}
