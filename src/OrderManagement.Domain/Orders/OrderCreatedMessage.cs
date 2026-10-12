namespace OrderManagement.Domain.Orders;

public sealed record OrderCreatedMessage(Guid OrderId, Guid CorrelationId, string EventType)
{
    public const string EventName = "OrderCreated";

    public static OrderCreatedMessage Create(Guid orderId)
    {
        return new OrderCreatedMessage(orderId, orderId, EventName);
    }
}
