using System.Threading.Channels;
using OrderManagement.Domain.Orders;

namespace OrderManagement.Api.Messaging;

public sealed class OrderStatusNotifier
{
    private readonly Lock gate = new();
    private readonly List<Channel<OrderStatusChangedMessage>> subscribers = [];

    public IDisposable Subscribe(out ChannelReader<OrderStatusChangedMessage> reader)
    {
        var channel = Channel.CreateUnbounded<OrderStatusChangedMessage>();
        lock (gate)
        {
            subscribers.Add(channel);
        }

        reader = channel.Reader;
        return new Subscription(() =>
        {
            lock (gate)
            {
                subscribers.Remove(channel);
            }

            channel.Writer.TryComplete();
        });
    }

    public void Publish(OrderStatusChangedMessage message)
    {
        lock (gate)
        {
            foreach (var subscriber in subscribers)
            {
                subscriber.Writer.TryWrite(message);
            }
        }
    }

    private sealed class Subscription(Action dispose) : IDisposable
    {
        public void Dispose()
        {
            dispose();
        }
    }
}
