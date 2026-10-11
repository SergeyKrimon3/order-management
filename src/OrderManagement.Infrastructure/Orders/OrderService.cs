using Microsoft.EntityFrameworkCore;
using OrderManagement.Domain.Orders;
using OrderManagement.Infrastructure.Messaging;
using OrderManagement.Infrastructure.Persistence;

namespace OrderManagement.Infrastructure.Orders;

public sealed class OrderService(OrdersDbContext database, IOrderCreatedPublisher publisher)
{
    public async Task<Order> CreateAsync(
        string customer,
        string product,
        decimal amount,
        string? image,
        CancellationToken cancellationToken)
    {
        var order = Order.Create(customer, product, amount, image);
        database.Orders.Add(order);
        await database.SaveChangesAsync(cancellationToken);
        await publisher.PublishAsync(OrderCreatedMessage.Create(order.Id), cancellationToken);
        return order;
    }

    public async Task<IReadOnlyList<Order>> ListAsync(CancellationToken cancellationToken)
    {
        return await database.Orders
            .AsNoTracking()
            .OrderByDescending(order => order.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<Order?> FindAsync(Guid id, CancellationToken cancellationToken)
    {
        return await database.Orders
            .AsNoTracking()
            .FirstOrDefaultAsync(order => order.Id == id, cancellationToken);
    }
}
