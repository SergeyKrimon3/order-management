using Microsoft.EntityFrameworkCore;
using OrderManagement.Domain.Favorites;
using OrderManagement.Infrastructure.Persistence;

namespace OrderManagement.Infrastructure.Favorites;

public sealed class FavoriteService(OrdersDbContext database)
{
    public async Task<IReadOnlyList<Favorite>> ListAsync(CancellationToken cancellationToken)
    {
        return await database.Favorites
            .AsNoTracking()
            .OrderByDescending(favorite => favorite.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<Favorite> AddAsync(Guid orderId, CancellationToken cancellationToken)
    {
        var existing = await database.Favorites
            .FirstOrDefaultAsync(favorite => favorite.OrderId == orderId, cancellationToken);
        if (existing is not null)
        {
            return existing;
        }

        if (!await database.Orders.AnyAsync(order => order.Id == orderId, cancellationToken))
        {
            throw new ArgumentException("Order was not found.", nameof(orderId));
        }

        var favorite = Favorite.Create(orderId);
        database.Favorites.Add(favorite);
        await database.SaveChangesAsync(cancellationToken);
        return favorite;
    }

    public async Task RemoveAsync(Guid orderId, CancellationToken cancellationToken)
    {
        var favorite = await database.Favorites
            .FirstOrDefaultAsync(item => item.OrderId == orderId, cancellationToken);
        if (favorite is null)
        {
            return;
        }

        database.Favorites.Remove(favorite);
        await database.SaveChangesAsync(cancellationToken);
    }
}
