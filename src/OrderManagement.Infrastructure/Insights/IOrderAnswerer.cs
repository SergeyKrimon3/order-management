namespace OrderManagement.Infrastructure.Insights;

public interface IOrderAnswerer
{
    Task<string> AnswerAsync(
        string question,
        string? locale,
        IReadOnlyList<OrderBrief> orders,
        DateTime now,
        CancellationToken cancellationToken);
}

public sealed record OrderBrief(
    string Customer,
    string Product,
    decimal Amount,
    string Status,
    DateTime CreatedAt,
    DateTime UpdatedAt);
