using Microsoft.AspNetCore.Mvc;
using OrderManagement.Api.Contracts;
using OrderManagement.Infrastructure.Orders;

namespace OrderManagement.Api.Controllers;

[ApiController]
[Route("orders")]
public sealed class OrdersController(OrderService orders) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<OrderResponse>>> List(CancellationToken cancellationToken)
    {
        var items = await orders.ListAsync(cancellationToken);
        return Ok(items.Select(OrderResponse.From).ToArray());
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<OrderResponse>> Get(Guid id, CancellationToken cancellationToken)
    {
        var order = await orders.FindAsync(id, cancellationToken);
        if (order is null)
        {
            return NotFound();
        }

        return Ok(OrderResponse.From(order));
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
                cancellationToken);

            return CreatedAtAction(nameof(Get), new { id = order.Id }, OrderResponse.From(order));
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }
}
