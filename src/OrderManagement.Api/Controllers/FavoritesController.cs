using Microsoft.AspNetCore.Mvc;
using OrderManagement.Api.Contracts;
using OrderManagement.Infrastructure.Favorites;

namespace OrderManagement.Api.Controllers;

[ApiController]
[Route("favorites")]
public sealed class FavoritesController(FavoriteService favorites) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<FavoriteResponse>>> List(CancellationToken cancellationToken)
    {
        var items = await favorites.ListAsync(cancellationToken);
        return Ok(items.Select(FavoriteResponse.From).ToArray());
    }

    [HttpPost]
    public async Task<ActionResult<FavoriteResponse>> Create(
        CreateFavoriteRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var favorite = await favorites.AddAsync(request.OrderId, cancellationToken);
            return Ok(FavoriteResponse.From(favorite));
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpDelete("{orderId:guid}")]
    public async Task<IActionResult> Delete(Guid orderId, CancellationToken cancellationToken)
    {
        await favorites.RemoveAsync(orderId, cancellationToken);
        return NoContent();
    }
}
