using OrderManagement.Domain.Favorites;

namespace OrderManagement.Api.Contracts;

public sealed record CreateFavoriteRequest(Guid OrderId);

public sealed record FavoriteResponse(Guid OrderId, DateTime CreatedAt)
{
    public static FavoriteResponse From(Favorite favorite)
    {
        return new FavoriteResponse(favorite.OrderId, favorite.CreatedAt);
    }
}
