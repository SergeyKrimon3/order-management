using System.Text.Json;
using OrderManagement.Domain.Orders;
using OrderManagement.Infrastructure.Messaging;
using OrderManagement.Infrastructure.Orders;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace OrderManagement.Worker;

public sealed class OrderCreatedConsumer(
    IServiceScopeFactory scopes,
    RabbitMqOptions options,
    ILogger<OrderCreatedConsumer> logger) : BackgroundService
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
                logger.LogError(exception, "Order consumer disconnected. Retrying.");
                await Task.Delay(TimeSpan.FromSeconds(2), stoppingToken);
            }
        }
    }

    private async Task ListenAsync(CancellationToken stoppingToken)
    {
        var settings = options;
        var factory = RabbitMqClient.CreateFactory(settings, "order-management-worker");
        await using var connection = await factory.CreateConnectionAsync(stoppingToken);
        var channelOptions = new CreateChannelOptions(false, false, null, consumerDispatchConcurrency: 8);
        await using var channel = await connection.CreateChannelAsync(channelOptions, stoppingToken);
        await RabbitMqClient.DeclareQueueAsync(channel, settings.Queue, stoppingToken);
        await channel.BasicQosAsync(0, 16, false, stoppingToken);

        var gate = new SemaphoreSlim(1, 1);
        var consumer = new AsyncEventingBasicConsumer(channel);
        consumer.ReceivedAsync += (_, delivery) => OnReceivedAsync(channel, gate, delivery, stoppingToken);
        await channel.BasicConsumeAsync(settings.Queue, autoAck: false, consumer, stoppingToken);
        logger.LogInformation("Order consumer is waiting for {Queue}.", settings.Queue);
        await Task.Delay(Timeout.Infinite, stoppingToken);
    }

    private async Task OnReceivedAsync(
        IChannel channel,
        SemaphoreSlim gate,
        BasicDeliverEventArgs delivery,
        CancellationToken stoppingToken)
    {
        var body = delivery.Body.ToArray();
        var tag = delivery.DeliveryTag;
        try
        {
            var message = JsonSerializer.Deserialize<OrderCreatedMessage>(body, JsonOptions);
            if (message is null || message.OrderId == Guid.Empty || message.EventType != OrderCreatedMessage.EventName)
            {
                logger.LogWarning("Discarding an order message that does not match {EventType}.", OrderCreatedMessage.EventName);
                await SettleAsync(channel, gate, tag, ack: false, requeue: false);
                return;
            }

            await using var scope = scopes.CreateAsyncScope();
            var processor = scope.ServiceProvider.GetRequiredService<OrderCreatedProcessor>();
            await processor.ProcessAsync(message.OrderId, stoppingToken);
            logger.LogInformation(
                "Finished {EventType} for order {OrderId} with correlation {CorrelationId}.",
                message.EventType,
                message.OrderId,
                message.CorrelationId);
            await SettleAsync(channel, gate, tag, ack: true, requeue: false);
        }
        catch (JsonException exception)
        {
            logger.LogError(exception, "Discarding an unreadable order message.");
            await SettleAsync(channel, gate, tag, ack: false, requeue: false);
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            await SettleAsync(channel, gate, tag, ack: false, requeue: true);
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Order message failed and will be retried.");
            await SettleAsync(channel, gate, tag, ack: false, requeue: true);
        }
    }

    private static async Task SettleAsync(IChannel channel, SemaphoreSlim gate, ulong tag, bool ack, bool requeue)
    {
        await gate.WaitAsync();
        try
        {
            if (ack)
            {
                await channel.BasicAckAsync(tag, multiple: false);
            }
            else
            {
                await channel.BasicNackAsync(tag, multiple: false, requeue: requeue);
            }
        }
        finally
        {
            gate.Release();
        }
    }
}
