using OrderManagement.Domain.Orders;

namespace OrderManagement.Tests;

public class OrderTests
{
    [Fact]
    public void Create_WithValidData_StartsAsPendente()
    {
        var order = Order.Create("Ada Lovelace", "Teclado", 150.5m);

        Assert.Equal(OrderStatus.Pendente, order.Status);
        Assert.Equal("Ada Lovelace", order.Customer);
        Assert.Equal(150.50m, order.Amount);
        Assert.NotEqual(Guid.Empty, order.Id);
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

        order.MarkAsProcessing();
        order.MarkAsFinished();

        Assert.Equal(OrderStatus.Finalizado, order.Status);
    }
}
