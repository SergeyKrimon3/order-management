using OrderManagement.Infrastructure;
using OrderManagement.Infrastructure.Persistence;
using OrderManagement.Worker;

var builder = WebApplication.CreateBuilder(args);

LocalDotEnv.ApplyOrdersConnection(builder.Configuration, builder.Environment.ContentRootPath);

builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddHostedService<OrderCreatedConsumer>();

var app = builder.Build();

app.MapHealthChecks("/health");

app.Run();
