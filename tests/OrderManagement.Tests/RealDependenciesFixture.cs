using System.Globalization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using OrderManagement.Infrastructure;
using OrderManagement.Infrastructure.Persistence;
using OrderManagement.Worker;
using Testcontainers.PostgreSql;
using Testcontainers.RabbitMq;

namespace OrderManagement.Tests;

public sealed class RealDependenciesFixture : IAsyncLifetime
{
    private PostgreSqlContainer? postgres;
    private RabbitMqContainer? rabbit;
    private IHost? host;

    public IServiceProvider Services => host?.Services ?? throw new InvalidOperationException("The test host is not running.");

    public async Task InitializeAsync()
    {
        postgres = new PostgreSqlBuilder("postgres:17-alpine")
            .WithDatabase("orders")
            .WithUsername("postgres")
            .WithPassword("postgres")
            .Build();
        rabbit = new RabbitMqBuilder("rabbitmq:4-management-alpine")
            .WithUsername("admin")
            .WithPassword("admin")
            .Build();

        await Task.WhenAll(postgres.StartAsync(), rabbit.StartAsync());

        var settings = new Dictionary<string, string?>
        {
            ["ConnectionStrings:Orders"] = postgres.GetConnectionString(),
            ["RabbitMQ:Host"] = rabbit.Hostname,
            ["RabbitMQ:Port"] = rabbit.GetMappedPublicPort(5672).ToString(CultureInfo.InvariantCulture),
            ["RabbitMQ:Username"] = "admin",
            ["RabbitMQ:Password"] = "admin"
        };

        var options = new DbContextOptionsBuilder<OrdersDbContext>()
            .UseNpgsql(postgres.GetConnectionString())
            .Options;
        await using (var database = new OrdersDbContext(options))
        {
            await database.Database.MigrateAsync();
        }

        var builder = Host.CreateApplicationBuilder(new HostApplicationBuilderSettings
        {
            EnvironmentName = Environments.Production
        });
        builder.Configuration.AddInMemoryCollection(settings);
        builder.Services.AddInfrastructure(builder.Configuration);
        builder.Services.AddHostedService<OrderCreatedConsumer>();
        host = builder.Build();
        await host.StartAsync();
    }

    public async Task DisposeAsync()
    {
        if (host is not null)
        {
            await host.StopAsync();
            host.Dispose();
        }

        if (rabbit is not null)
        {
            await rabbit.DisposeAsync();
        }

        if (postgres is not null)
        {
            await postgres.DisposeAsync();
        }
    }
}

[CollectionDefinition(Name)]
public sealed class RealDependenciesCollection : ICollectionFixture<RealDependenciesFixture>
{
    public const string Name = "Real dependencies";
}
