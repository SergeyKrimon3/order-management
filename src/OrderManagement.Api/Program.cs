using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using OrderManagement.Infrastructure;
using OrderManagement.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

LocalDotEnv.ApplyOrdersConnection(builder.Configuration, builder.Environment.ContentRootPath);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddOpenApi();
builder.Services.AddInfrastructure(builder.Configuration);

var app = builder.Build();

await using (var scope = app.Services.CreateAsyncScope())
{
    var database = scope.ServiceProvider.GetRequiredService<OrdersDbContext>();
    await database.Database.MigrateAsync();
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

if (!string.IsNullOrEmpty(Environment.GetEnvironmentVariable("ASPNETCORE_HTTPS_PORTS")))
{
    app.UseHttpsRedirection();
}
app.MapHealthChecks("/health");
app.MapControllers();

app.Run();
