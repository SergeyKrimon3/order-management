namespace OrderManagement.Infrastructure.Messaging;

public sealed class RabbitMqOptions
{
    public const string SectionName = "RabbitMQ";

    public string Host { get; set; } = "localhost";

    public int Port { get; set; } = 5672;

    public string Username { get; set; } = "admin";

    public string Password { get; set; } = "admin";

    public string Queue { get; set; } = "order-created";

    public string StatusQueue { get; set; } = "order-status-changed";
}
