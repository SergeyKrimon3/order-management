using System.Text.Json;
using System.Text.Json.Serialization;
using OrderManagement.Api.Contracts;
using OrderManagement.Domain.Orders;

namespace OrderManagement.Tests;

public class GoldenTests
{
    private static readonly JsonSerializerOptions ApiJson = CreateApiJson();
    private static readonly JsonSerializerOptions MessageJson = CreateMessageJson();
    private static readonly Guid OrderId = Guid.Parse("1f457889-3e99-4075-8802-ffec7e55026c");
    private static readonly DateTime CreatedAt = new(2026, 10, 11, 20, 4, 41, DateTimeKind.Unspecified);
    private static readonly DateTime ProcessingAt = new(2026, 10, 11, 20, 4, 44, DateTimeKind.Unspecified);
    private static readonly DateTime CompletedAt = new(2026, 10, 11, 20, 4, 49, DateTimeKind.Unspecified);
    private const string Image = "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=900&q=80";

    [Fact]
    public void OrderDetail_MatchesTheApprovedResponse()
    {
        AssertMatches("order-detail.json", JsonSerializer.Serialize(Detail(), ApiJson));
    }

    [Fact]
    public void OrderList_MatchesTheApprovedResponse()
    {
        OrderResponse[] list = [Detail() with { History = null }];
        AssertMatches("order-list.json", JsonSerializer.Serialize(list, ApiJson));
    }

    [Fact]
    public void OrderCreatedMessage_MatchesTheApprovedPayload()
    {
        var message = OrderCreatedMessage.Create(OrderId);
        AssertMatches("order-created.json", JsonSerializer.Serialize(message, MessageJson));
    }

    [Fact]
    public void OrderStatusChangedMessage_MatchesTheApprovedPayload()
    {
        var message = OrderStatusChangedMessage.Create(OrderId, OrderStatus.Processing);
        AssertMatches("order-status-changed.json", JsonSerializer.Serialize(message, MessageJson));
    }

    [Fact]
    public void StatusEvent_MatchesTheApprovedPayload()
    {
        var message = OrderStatusChangedMessage.Create(OrderId, OrderStatus.Completed);
        var payload = JsonSerializer.Serialize(new { message.OrderId, message.Status }, MessageJson);
        AssertMatches("order-status-event.json", payload);
    }

    private static OrderResponse Detail()
    {
        return new OrderResponse(
            OrderId,
            "Ada Lovelace",
            "Teclado",
            150.50m,
            OrderStatus.Completed,
            CreatedAt,
            CompletedAt,
            Image,
            null)
        {
            History =
            [
                new OrderStatusChangeResponse(1, OrderStatus.Pending, CreatedAt),
                new OrderStatusChangeResponse(2, OrderStatus.Processing, ProcessingAt),
                new OrderStatusChangeResponse(3, OrderStatus.Completed, CompletedAt)
            ]
        };
    }

    private static void AssertMatches(string name, string actual)
    {
        var path = Path.Combine(AppContext.BaseDirectory, "Golden", name);
        var approved = File.ReadAllText(path).Replace("\r\n", "\n", StringComparison.Ordinal).Trim();
        Assert.Equal(approved, actual.Replace("\r\n", "\n", StringComparison.Ordinal).Trim());
    }

    private static JsonSerializerOptions CreateApiJson()
    {
        var options = new JsonSerializerOptions(JsonSerializerDefaults.Web)
        {
            WriteIndented = true
        };
        options.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase));
        return options;
    }

    private static JsonSerializerOptions CreateMessageJson()
    {
        return new JsonSerializerOptions(JsonSerializerDefaults.Web)
        {
            WriteIndented = true
        };
    }
}
