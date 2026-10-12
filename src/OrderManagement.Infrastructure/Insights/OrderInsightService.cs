using Microsoft.EntityFrameworkCore;
using OrderManagement.Domain.Orders;
using OrderManagement.Infrastructure.Persistence;

namespace OrderManagement.Infrastructure.Insights;

public sealed class OrderInsightService(OrdersDbContext database, IOrderAnswerer answers)
{
    public async Task<string> AskAsync(
        string question,
        string? locale,
        IReadOnlyList<ChatTurn> history,
        CancellationToken cancellationToken)
    {
        var orders = await database.Orders
            .AsNoTracking()
            .OrderByDescending(order => order.CreatedAt)
            .Select(order => new OrderBrief(
                order.Id,
                order.Customer,
                order.Product,
                order.Amount,
                order.Status.ToString().ToLowerInvariant(),
                order.CreatedAt,
                order.UpdatedAt,
                order.RepeatOfId))
            .ToListAsync(cancellationToken);

        var favorites = await database.Favorites
            .AsNoTracking()
            .OrderByDescending(favorite => favorite.CreatedAt)
            .Select(favorite => new FavoriteBrief(favorite.OrderId, favorite.CreatedAt))
            .ToListAsync(cancellationToken);

        return await answers.AnswerAsync(
            question,
            locale,
            orders,
            favorites,
            history,
            BrazilTime.Now(),
            cancellationToken);
    }
}
