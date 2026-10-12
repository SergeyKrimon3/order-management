using Microsoft.Extensions.DependencyInjection;
using OrderManagement.Infrastructure.Messaging;
using RabbitMQ.Client;

namespace OrderManagement.Tests;

[Collection(RealDependenciesCollection.Name)]
public sealed class RabbitMqReconnectTests(RealDependenciesFixture dependencies)
{
    [Fact]
    public async Task WaitUntilClosed_CompletesWhenTheBrokerConnectionCloses()
    {
        var options = dependencies.Services.GetRequiredService<RabbitMqOptions>();
        var factory = RabbitMqClient.CreateFactory(options, "order-management-tests");
        await using var connection = await factory.CreateConnectionAsync();
        await using var channel = await connection.CreateChannelAsync();

        var waiting = RabbitMqClient.WaitUntilClosedAsync(connection, channel, CancellationToken.None);
        await connection.CloseAsync();

        var exception = await Assert.ThrowsAsync<IOException>(() => waiting.WaitAsync(TimeSpan.FromSeconds(5)));
        Assert.Equal("RabbitMQ connection closed.", exception.Message);
    }
}
