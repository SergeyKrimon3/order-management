using Microsoft.EntityFrameworkCore;
using OrderManagement.Domain.Orders;
using OrderManagement.Infrastructure.Persistence;

namespace OrderManagement.Infrastructure.Insights;

public sealed class OrderInsightService(OrdersDbContext database, IOrderAnswerer answers)
{
    public async Task<string> AskAsync(string question, string? locale, CancellationToken cancellationToken)
    {
        var orders = await database.Orders
            .AsNoTracking()
            .OrderByDescending(order => order.CreatedAt)
            .Select(order => new OrderBrief(
                order.Customer,
                order.Product,
                order.Amount,
                order.Status.ToString().ToLowerInvariant(),
                order.CreatedAt,
                order.UpdatedAt))
            .ToListAsync(cancellationToken);

        return await answers.AnswerAsync(question, locale, orders, BrazilTime.Now(), cancellationToken);
    }
}
