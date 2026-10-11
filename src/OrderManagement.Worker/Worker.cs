namespace OrderManagement.Worker;

public class Worker(ILogger<Worker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("Order worker is waiting for the message consumer.");
        await Task.Delay(Timeout.Infinite, stoppingToken);
    }
}
