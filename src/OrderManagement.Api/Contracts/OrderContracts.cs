using OrderManagement.Domain.Orders;

namespace OrderManagement.Api.Contracts;

public sealed record CreateOrderRequest(string Customer, string Product, decimal Amount, string? Image, Guid? RepeatOf);

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
}
