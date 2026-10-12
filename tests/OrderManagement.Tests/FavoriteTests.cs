using OrderManagement.Domain.Favorites;
using OrderManagement.Domain.Orders;

namespace OrderManagement.Tests;

public class FavoriteTests
{
    [Fact]
    public void Create_WithOrder_StoresTheOrder()
    {
        var orderId = Guid.NewGuid();

        var favorite = Favorite.Create(orderId);

        Assert.Equal(orderId, favorite.OrderId);
        Assert.InRange(favorite.CreatedAt, BrazilTime.Now().AddSeconds(-2), BrazilTime.Now().AddSeconds(2));
    }

    [Fact]
    public void Create_WithoutOrder_Throws()
    {
        Assert.Throws<ArgumentException>(() => Favorite.Create(Guid.Empty));
    }
}
