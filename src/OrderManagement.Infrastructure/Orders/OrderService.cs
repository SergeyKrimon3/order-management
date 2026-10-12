using Microsoft.EntityFrameworkCore;
using OrderManagement.Domain.Orders;
using OrderManagement.Infrastructure.Messaging;
using OrderManagement.Infrastructure.Persistence;

namespace OrderManagement.Infrastructure.Orders;

public sealed class OrderService(OrdersDbContext database)
{
    public async Task<Order> CreateAsync(
        string customer,
        string product,
        decimal amount,
        string? image,
        Guid? repeatOfId,
        CancellationToken cancellationToken)
    {
        if (repeatOfId is Guid sourceId && !await database.Orders.AnyAsync(order => order.Id == sourceId, cancellationToken))
        {
            throw new ArgumentException("Order to repeat was not found.", nameof(repeatOfId));
        }

        var order = Order.Create(customer, product, amount, image, repeatOfId);
        database.Orders.Add(order);
        database.OutboxMessages.Add(OutboxMessage.For(OrderCreatedMessage.Create(order.Id)));
        await database.SaveChangesAsync(cancellationToken);
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
