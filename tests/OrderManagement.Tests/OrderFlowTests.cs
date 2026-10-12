using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using OrderManagement.Domain.Orders;
using OrderManagement.Infrastructure.Orders;
using OrderManagement.Infrastructure.Persistence;

namespace OrderManagement.Tests;

[Collection(RealDependenciesCollection.Name)]
public sealed class OrderFlowTests(RealDependenciesFixture dependencies)
{
    [Fact]
    public async Task Create_PublishesThroughRabbitAndCompletesOnPostgres()
    {
        await using var scope = dependencies.Services.CreateAsyncScope();
        var orders = scope.ServiceProvider.GetRequiredService<OrderService>();
        var created = await orders.CreateAsync("Ada Lovelace", "Teclado", 150.5m, null, null, CancellationToken.None);

        var deadline = DateTime.UtcNow.AddSeconds(40);
        while (DateTime.UtcNow < deadline)
        {
            await using var read = dependencies.Services.CreateAsyncScope();
            var database = read.ServiceProvider.GetRequiredService<OrdersDbContext>();
            var status = await database.Orders
                .Where(order => order.Id == created.Id)
                .Select(order => order.Status)
                .SingleAsync();
            var history = await database.OrderStatusChanges
                .Where(change => change.OrderId == created.Id)
                .OrderBy(change => change.OccurredAt)
                .ThenBy(change => change.Id)
                .Select(change => change.Status)
                .ToListAsync();
            var outbox = await database.OutboxMessages
                .Where(message => message.CorrelationId == created.Id)
                .OrderBy(message => message.CreatedAt)
                .ThenBy(message => message.Id)
                .ToListAsync();

            var published = outbox.Count == 3 && outbox.All(message => message.PublishedAt is not null);
            if (status == OrderStatus.Completed && history.Count == 3 && published)
            {
                Assert.Equal(
                    [OrderStatus.Pending, OrderStatus.Processing, OrderStatus.Completed],
                    history);
                Assert.Equal(
                    [OrderCreatedMessage.EventName, OrderStatusChangedMessage.EventName, OrderStatusChangedMessage.EventName],
                    outbox.Select(message => message.EventType).ToArray());
                return;
            }

            await Task.Delay(TimeSpan.FromMilliseconds(250));
        }

        Assert.Fail("The order did not finish on PostgreSQL with three published messages.");
    }
}
