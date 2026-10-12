using System.Collections.Generic;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace OrderManagement.Infrastructure.Messaging;

public static class RabbitMqClient
{
    public static ConnectionFactory CreateFactory(RabbitMqOptions options, string clientName)
    {
        return new ConnectionFactory
        {
            HostName = options.Host,
            Port = options.Port,
            UserName = options.Username,
            Password = options.Password,
            ClientProvidedName = clientName,
            RequestedHeartbeat = TimeSpan.FromSeconds(10),
            AutomaticRecoveryEnabled = false
        };
    }

    public static Task DeclareQueueAsync(IChannel channel, string queue, CancellationToken cancellationToken)
    {
        return channel.QueueDeclareAsync(queue, durable: true, exclusive: false, autoDelete: false, arguments: null, noWait: false, cancellationToken: cancellationToken);
    }

    public static async Task WaitUntilClosedAsync(IConnection connection, IChannel channel, CancellationToken cancellationToken)
    {
        var closed = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        AsyncEventHandler<ShutdownEventArgs> onShutdown = (_, _) =>
        {
            closed.TrySetResult();
            return Task.CompletedTask;
        };

        connection.ConnectionShutdownAsync += onShutdown;
        channel.ChannelShutdownAsync += onShutdown;
        try
        {
            if (!connection.IsOpen || !channel.IsOpen)
            {
                throw new IOException("RabbitMQ connection closed.");
            }

            var untilStopped = Task.Delay(Timeout.Infinite, cancellationToken);
            var completed = await Task.WhenAny(untilStopped, closed.Task);
            if (completed == untilStopped)
            {
                await untilStopped;
            }

            throw new IOException("RabbitMQ connection closed.");
        }
        finally
        {
            connection.ConnectionShutdownAsync -= onShutdown;
            channel.ChannelShutdownAsync -= onShutdown;
        }
    }
}
