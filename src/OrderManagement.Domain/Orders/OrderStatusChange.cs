namespace OrderManagement.Domain.Orders;

public sealed class OrderStatusChange
{
    public long Id { get; private set; }

    public Guid OrderId { get; private set; }

    public OrderStatus Status { get; private set; }

    public DateTime OccurredAt { get; private set; }

    private OrderStatusChange()
    {
    }

    public static OrderStatusChange Record(Guid orderId, OrderStatus status, DateTime occurredAt)
    {
        if (orderId == Guid.Empty)
        {
            throw new ArgumentException("Order is required.", nameof(orderId));
        }

        return new OrderStatusChange
        {
            OrderId = orderId,
            Status = status,
            OccurredAt = occurredAt
        };
    }
}
