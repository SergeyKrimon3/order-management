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
    public void MarkAsCompleted_BeforeProcessing_Throws()
    {
        var order = Order.Create("Ada Lovelace", "Teclado", 10m);

        Assert.Throws<InvalidOperationException>(order.MarkAsCompleted);
    }

    [Fact]
    public void MarkAsProcessing_ThenCompleted_FollowsTheRequiredSequence()
    {
        var order = Order.Create("Ada Lovelace", "Teclado", 10m);

        var createdAt = order.UpdatedAt;

        order.MarkAsProcessing();
        order.MarkAsCompleted();

        Assert.Equal(OrderStatus.Completed, order.Status);
        Assert.True(order.UpdatedAt >= createdAt);
        Assert.Throws<InvalidOperationException>(order.MarkAsProcessing);
        Assert.Throws<InvalidOperationException>(order.MarkAsCompleted);
    }

    [Fact]
    public void Remaining_WaitsFiveSecondsFromProcessing()
    {
        var started = new DateTime(2026, 10, 11, 20, 4, 41, DateTimeKind.Unspecified);

        Assert.Equal(TimeSpan.FromSeconds(5), OrderProcessing.Remaining(started, started));
        Assert.Equal(TimeSpan.FromSeconds(3), OrderProcessing.Remaining(started, started.AddSeconds(2)));
        Assert.Equal(TimeSpan.Zero, OrderProcessing.Remaining(started, started.AddSeconds(5)));
        Assert.Equal(TimeSpan.Zero, OrderProcessing.Remaining(started, started.AddSeconds(6)));
    }

    [Fact]
    public void RemainingPending_StaysVisibleForThreeSeconds()
    {
        var createdAt = new DateTime(2026, 10, 11, 20, 4, 41, DateTimeKind.Unspecified);

        Assert.Equal(TimeSpan.FromSeconds(3), OrderProcessing.RemainingPending(createdAt, createdAt));
        Assert.Equal(TimeSpan.FromSeconds(1), OrderProcessing.RemainingPending(createdAt, createdAt.AddSeconds(2)));
        Assert.Equal(TimeSpan.Zero, OrderProcessing.RemainingPending(createdAt, createdAt.AddSeconds(3)));
    }
}
