using System.Text.Json;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Mvc;
using OrderManagement.Api.Contracts;
using OrderManagement.Api.Messaging;
using OrderManagement.Infrastructure.Insights;
using OrderManagement.Infrastructure.Orders;

namespace OrderManagement.Api.Controllers;

[ApiController]
[Route("orders")]
public sealed class OrdersController(
    OrderService orders,
    OrderStatusNotifier statusChanges,
    OrderInsightService insights) : ControllerBase
{
    private static readonly JsonSerializerOptions EventJson = new(JsonSerializerDefaults.Web);
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<OrderResponse>>> List(CancellationToken cancellationToken)
    {
        var items = await orders.ListAsync(cancellationToken);
        return Ok(items.Select(OrderResponse.From).ToArray());
    }

    [HttpPost("ask")]
    public async Task<ActionResult<AskOrderResponse>> Ask(AskOrderRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Question) || request.Question.Trim().Length > 1000)
        {
            return BadRequest(new { message = "Question must be between 1 and 1000 characters." });
        }

        try
        {
            var answer = await insights.AskAsync(
                request.Question,
                request.Locale,
                ReadHistory(request.History),
                cancellationToken);
            return Ok(new AskOrderResponse(answer));
        }
        catch (OrderQuestionException exception)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new { message = exception.Message });
        }
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<OrderResponse>> Get(Guid id, CancellationToken cancellationToken)
    {
        var order = await orders.FindAsync(id, cancellationToken);
        if (order is null)
        {
            return NotFound();
        }

        var history = await orders.ListStatusChangesAsync(id, cancellationToken);
        return Ok(OrderResponse.From(order, history));
    }

    [HttpGet("events")]
    public async Task Events(CancellationToken cancellationToken)
    {
        Response.ContentType = "text/event-stream";
        Response.Headers.CacheControl = "no-cache";
        Response.Headers.Append("X-Accel-Buffering", "no");
        HttpContext.Features.Get<IHttpResponseBodyFeature>()?.DisableBuffering();

        using var subscription = statusChanges.Subscribe(out var reader);
        try
        {
            await Response.WriteAsync(": connected\n\n", cancellationToken);
            await Response.Body.FlushAsync(cancellationToken);

            while (!cancellationToken.IsCancellationRequested)
            {
                using var wait = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
                wait.CancelAfter(TimeSpan.FromSeconds(15));
                try
                {
                    var message = await reader.ReadAsync(wait.Token);
                    var payload = JsonSerializer.Serialize(new { message.OrderId, message.Status }, EventJson);
                    await Response.WriteAsync($"data: {payload}\n\n", cancellationToken);
                }
                catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
                {
                    await Response.WriteAsync(": ping\n\n", cancellationToken);
                }

                await Response.Body.FlushAsync(cancellationToken);
            }
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
        }
    }

    [HttpPost]
    public async Task<ActionResult<OrderResponse>> Create(
        CreateOrderRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var order = await orders.CreateAsync(
                request.Customer,
                request.Product,
                request.Amount,
                request.Image,
                request.RepeatOf,
                cancellationToken);

            return CreatedAtAction(nameof(Get), new { id = order.Id }, OrderResponse.From(order));
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    private static IReadOnlyList<ChatTurn> ReadHistory(IReadOnlyList<AskTurnRequest>? history)
    {
        if (history is null || history.Count == 0)
        {
            return [];
        }

        return history
            .TakeLast(20)
            .Select(turn => new ChatTurn(NormalizeRole(turn.Role), TrimTurn(turn.Text)))
            .Where(turn => turn.Role.Length > 0 && turn.Text.Length > 0)
            .ToArray();
    }

    private static string NormalizeRole(string? role)
    {
        if (string.Equals(role, "user", StringComparison.OrdinalIgnoreCase))
        {
            return "user";
        }

        if (string.Equals(role, "assistant", StringComparison.OrdinalIgnoreCase))
        {
            return "assistant";
        }

        return string.Empty;
    }

    private static string TrimTurn(string? text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return string.Empty;
        }

        var trimmed = text.Trim();
        return trimmed.Length <= 1000 ? trimmed : trimmed[..1000];
    }
}
