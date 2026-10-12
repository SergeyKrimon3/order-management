namespace OrderManagement.Infrastructure.Insights;

public interface IOrderAnswerer
{
    Task<string> AnswerAsync(
        string question,
        string? locale,
        IReadOnlyList<OrderBrief> orders,
        IReadOnlyList<FavoriteBrief> favorites,
        IReadOnlyList<ChatTurn> history,
        DateTime now,
        CancellationToken cancellationToken);
}

public sealed record OrderBrief(
    Guid Id,
    string Customer,
    string Product,
    decimal Amount,
    string Status,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    Guid? RepeatOfId);

public sealed record FavoriteBrief(
    Guid OrderId,
    DateTime CreatedAt);

public sealed record ChatTurn(string Role, string Text);
