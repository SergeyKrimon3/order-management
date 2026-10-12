using Microsoft.Extensions.Diagnostics.HealthChecks;
using RabbitMQ.Client;

namespace OrderManagement.Infrastructure.Messaging;

public sealed class RabbitMqHealthCheck(RabbitMqOptions options) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var factory = RabbitMqClient.CreateFactory(options, "order-management-health");
            await using var connection = await factory.CreateConnectionAsync(cancellationToken);
            await using var channel = await connection.CreateChannelAsync(new CreateChannelOptions(false, false), cancellationToken);
            await RabbitMqClient.DeclareQueueAsync(channel, options.Queue, cancellationToken);
            return HealthCheckResult.Healthy();
        }
        catch (Exception exception)
        {
            return HealthCheckResult.Unhealthy("RabbitMQ is unavailable.", exception);
        }
    }
}
