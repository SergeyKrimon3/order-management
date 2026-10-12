using OrderManagement.Domain.Orders;

namespace OrderManagement.Infrastructure.Messaging;

public interface IOrderStatusChangedPublisher
{
    Task PublishAsync(OrderStatusChangedMessage message, string? traceParent, CancellationToken cancellationToken);
}
