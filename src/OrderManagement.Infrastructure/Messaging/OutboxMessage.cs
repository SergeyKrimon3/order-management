using System.Text.Json;
using OrderManagement.Domain.Orders;

namespace OrderManagement.Infrastructure.Messaging;

public sealed class OutboxMessage
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    public Guid Id { get; private set; }

    public string EventType { get; private set; } = string.Empty;

    public string Payload { get; private set; } = string.Empty;

    public Guid CorrelationId { get; private set; }

    public DateTime CreatedAt { get; private set; }

    public DateTime? PublishedAt { get; private set; }

    private OutboxMessage()
    {
    }

    public static OutboxMessage For(OrderCreatedMessage message)
    {
        return Create(message.EventType, message.CorrelationId, message);
    }

    public static OutboxMessage For(OrderStatusChangedMessage message)
    {
        return Create(message.EventType, message.OrderId, message);
    }

    private static OutboxMessage Create(string eventType, Guid correlationId, object message)
    {
        return new OutboxMessage
        {
            Id = Guid.NewGuid(),
            EventType = eventType,
            Payload = JsonSerializer.Serialize(message, Json),
            CorrelationId = correlationId,
            CreatedAt = BrazilTime.Now()
        };
    }
}
