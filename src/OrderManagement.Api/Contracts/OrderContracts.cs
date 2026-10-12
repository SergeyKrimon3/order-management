using System.Text.Json.Serialization;
using OrderManagement.Domain.Orders;

namespace OrderManagement.Api.Contracts;

public sealed record CreateOrderRequest(string Customer, string Product, decimal Amount, string? Image, Guid? RepeatOf);

public sealed record AskOrderRequest(string Question, string? Locale, IReadOnlyList<AskTurnRequest>? History);

public sealed record AskTurnRequest(string Role, string Text);

public sealed record AskOrderResponse(string Answer);

public sealed record OrderStatusChangeResponse(long Id, OrderStatus Status, DateTime OccurredAt);

public sealed record OrderResponse(
    Guid Id,
    string Customer,
    string Product,
    decimal Amount,
    OrderStatus Status,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    string? Image,
    Guid? RepeatOf)
{
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyList<OrderStatusChangeResponse>? History { get; init; }

    public static OrderResponse From(Order order)
    {
        return new OrderResponse(
            order.Id,
            order.Customer,
            order.Product,
            order.Amount,
            order.Status,
            order.CreatedAt,
            order.UpdatedAt,
            order.Image,
            order.RepeatOfId);
    }

    public static OrderResponse From(Order order, IReadOnlyList<OrderStatusChange> history)
    {
        return From(order) with
        {
            History = history
                .Select(change => new OrderStatusChangeResponse(change.Id, change.Status, change.OccurredAt))
                .ToArray()
        };
    }
}
