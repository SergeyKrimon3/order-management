using System.Diagnostics;
using System.Text.Json;
using OrderManagement.Domain.Orders;
using OrderManagement.Infrastructure.Messaging;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace OrderManagement.Api.Messaging;

public sealed class OrderStatusChangedListener(
    RabbitMqOptions options,
    OrderStatusNotifier notifier,
    ILogger<OrderStatusChangedListener> logger) : BackgroundService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ListenAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Order status listener disconnected. Retrying.");
                await Task.Delay(TimeSpan.FromSeconds(2), stoppingToken);
            }
        }
    }

    private async Task ListenAsync(CancellationToken stoppingToken)
    {
        var factory = RabbitMqClient.CreateFactory(options, "order-management-api-status");
        await using var connection = await factory.CreateConnectionAsync(stoppingToken);
        await using var channel = await connection.CreateChannelAsync(new CreateChannelOptions(false, false), stoppingToken);
        await RabbitMqClient.DeclareQueueAsync(channel, options.StatusQueue, stoppingToken);
        await channel.BasicQosAsync(0, 1, false, stoppingToken);

        var consumer = new AsyncEventingBasicConsumer(channel);
        consumer.ReceivedAsync += async (_, delivery) =>
        {
            try
            {
                var message = JsonSerializer.Deserialize<OrderStatusChangedMessage>(delivery.Body.Span, JsonOptions);
                if (message is null || message.OrderId == Guid.Empty || message.EventType != OrderStatusChangedMessage.EventName)
                {
                    await channel.BasicNackAsync(delivery.DeliveryTag, multiple: false, requeue: false);
                    return;
                }

                var traceParent = OrderActivity.ReadHeader(delivery.BasicProperties.Headers);
                using var activity = OrderActivity.Start("order.status", traceParent, ActivityKind.Consumer);
                activity?.SetTag("order.id", message.OrderId);
                logger.LogInformation(
                    "Received status {Status} for order {OrderId} on trace {TraceId}.",
                    message.Status,
                    message.OrderId,
                    activity?.TraceId);
                notifier.Publish(message);
                await channel.BasicAckAsync(delivery.DeliveryTag, multiple: false);
            }
            catch (JsonException exception)
            {
                logger.LogError(exception, "Discarding an unreadable order status message.");
                await channel.BasicNackAsync(delivery.DeliveryTag, multiple: false, requeue: false);
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Order status message failed and will be retried.");
                await channel.BasicNackAsync(delivery.DeliveryTag, multiple: false, requeue: true);
            }
        };

        await channel.BasicConsumeAsync(options.StatusQueue, autoAck: false, consumer, stoppingToken);
        logger.LogInformation("Order status listener is waiting for {Queue}.", options.StatusQueue);
        await RabbitMqClient.WaitUntilClosedAsync(connection, channel, stoppingToken);
    }
}
