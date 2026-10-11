using System.Collections.Generic;
using RabbitMQ.Client;

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
            AutomaticRecoveryEnabled = false
        };
    }

    public static Task DeclareQueueAsync(IChannel channel, string queue, CancellationToken cancellationToken)
    {
        return channel.QueueDeclareAsync(queue, durable: true, exclusive: false, autoDelete: false, arguments: null, noWait: false, cancellationToken: cancellationToken);
    }
}
