namespace OrderManagement.Domain.Orders;

public sealed record OrderStatusChangedMessage(Guid OrderId, string Status, string EventType)
{
    public const string EventName = "OrderStatusChanged";

    public static OrderStatusChangedMessage Create(Guid orderId, OrderStatus status)
    {
        return new OrderStatusChangedMessage(orderId, status.ToString().ToLowerInvariant(), EventName);
    }
}
