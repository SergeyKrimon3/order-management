using Microsoft.EntityFrameworkCore;
using OrderManagement.Domain.Orders;
using OrderManagement.Infrastructure.Persistence;

namespace OrderManagement.Infrastructure.Orders;

public sealed class OrderCreatedProcessor(OrdersDbContext database)
{
    public async Task ProcessAsync(Guid orderId, CancellationToken cancellationToken)
    {
        var order = await database.Orders.FirstOrDefaultAsync(item => item.Id == orderId, cancellationToken);
        if (order is null || order.Status == OrderStatus.Completed)
        {
            return;
        }

        if (order.Status == OrderStatus.Pending)
        {
            var visible = OrderProcessing.RemainingPending(order.CreatedAt, BrazilTime.Now());
            if (visible > TimeSpan.Zero)
            {
                await Task.Delay(visible, cancellationToken);
            }

            await database.Entry(order).ReloadAsync(cancellationToken);
            if (order.Status == OrderStatus.Pending)
            {
                order.MarkAsProcessing();
                await database.SaveChangesAsync(cancellationToken);
            }
        }

        if (order.Status != OrderStatus.Processing)
        {
            return;
        }

        var remaining = OrderProcessing.Remaining(order.UpdatedAt, BrazilTime.Now());
        if (remaining > TimeSpan.Zero)
        {
            await Task.Delay(remaining, cancellationToken);
        }

        await database.Entry(order).ReloadAsync(cancellationToken);
        if (order.Status != OrderStatus.Processing)
        {
            return;
        }

        order.MarkAsCompleted();
        await database.SaveChangesAsync(cancellationToken);
    }
}
