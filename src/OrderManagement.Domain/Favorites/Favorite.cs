using OrderManagement.Domain.Orders;

namespace OrderManagement.Domain.Favorites;

public sealed class Favorite
{
    public long Id { get; private set; }

    public Guid OrderId { get; private set; }

    public DateTime CreatedAt { get; private set; }

    private Favorite()
    {
    }

    public static Favorite Create(Guid orderId)
    {
        if (orderId == Guid.Empty)
        {
            throw new ArgumentException("Order is required.", nameof(orderId));
        }

        return new Favorite
        {
            OrderId = orderId,
            CreatedAt = BrazilTime.Now()
        };
    }
}
