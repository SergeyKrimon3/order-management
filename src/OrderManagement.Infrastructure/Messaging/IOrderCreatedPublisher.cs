using OrderManagement.Domain.Orders;

namespace OrderManagement.Infrastructure.Messaging;

public interface IOrderCreatedPublisher
{
    Task PublishAsync(OrderCreatedMessage message, string? traceParent, CancellationToken cancellationToken);
}
