using OrderManagement.Domain.Orders;

namespace OrderManagement.Tests;

public class OrderTests
{
    [Fact]
    public void Create_WithValidData_StartsAsPending()
    {
        var order = Order.Create("Ada Lovelace", "Teclado", 150.5m);

        Assert.Equal(OrderStatus.Pending, order.Status);
        Assert.Equal("Ada Lovelace", order.Customer);
        Assert.Equal(150.50m, order.Amount);
        Assert.Null(order.Image);
        Assert.Equal(order.CreatedAt, order.UpdatedAt);
        Assert.InRange(order.CreatedAt, BrazilTime.Now().AddSeconds(-2), BrazilTime.Now().AddSeconds(2));
        Assert.NotEqual(Guid.Empty, order.Id);
    }

    [Fact]
    public void Create_WithImageUrl_StoresTheUrl()
    {
        const string image = "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=900&q=80";

        var order = Order.Create("Vitrine", "Sacola", 59m, image);

        Assert.Equal(image, order.Image);
    }

    [Fact]
    public void Create_WithRelativeImage_Throws()
    {
        Assert.Throws<ArgumentException>(() => Order.Create("Vitrine", "Sacola", 59m, "/foto.jpg"));
    }

    [Fact]
    public void MarkAsFinished_BeforeProcessing_Throws()
    {
        var order = Order.Create("Ada Lovelace", "Teclado", 10m);

        Assert.Throws<InvalidOperationException>(order.MarkAsFinished);
    }

    [Fact]
    public void MarkAsProcessing_ThenFinished_FollowsTheRequiredSequence()
    {
        var order = Order.Create("Ada Lovelace", "Teclado", 10m);

        var createdAt = order.UpdatedAt;

        order.MarkAsProcessing();
        order.MarkAsFinished();

        Assert.Equal(OrderStatus.Finished, order.Status);
        Assert.True(order.UpdatedAt >= createdAt);
    }
}
