using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Logging;

namespace OrderManagement.Infrastructure.Insights;

public sealed class LlmOrderAnswerer(
    IHttpClientFactory httpClientFactory,
    LlmOptions options,
    ILogger<LlmOrderAnswerer> logger) : IOrderAnswerer
{
    public const string HttpClientName = "order-questions";

    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    private const string SystemPrompt =
        """
        You answer questions about a store using only the data in the user message.
        orders are the store orders. favorites are orders marked as favorites; each favorite.orderId matches an orders.id.
        history is the earlier conversation in this chat. Use it to resolve follow-ups and pronouns, such as "eles" or "which ones".
        Amounts are in BRL. Timestamps are local America/Sao_Paulo time, with no offset.
        Facts still come only from orders and favorites, not from earlier replies.
        If the data does not contain the answer, say you don't know.
        Do not invent orders, favorites, products, customers, amounts, or dates.
        Reply in the same language as the question, in one or two friendly sentences of plain text, without markdown.
        """;

    public async Task<string> AnswerAsync(
        string question,
        string? locale,
        IReadOnlyList<OrderBrief> orders,
        IReadOnlyList<FavoriteBrief> favorites,
        IReadOnlyList<ChatTurn> history,
        DateTime now,
        CancellationToken cancellationToken)
    {
        if (!options.IsEnabled)
        {
            throw new OrderQuestionException("The language model is not configured.");
        }

        var data = JsonSerializer.Serialize(new
        {
            now,
            timeZone = "America/Sao_Paulo",
            locale,
            orders,
            favorites,
            history
        }, Json);
        var user = data + "\n\nQuestion: " + question.Trim();
        var answer = await CompleteAsync(user, cancellationToken);
        if (string.IsNullOrWhiteSpace(answer))
        {
            throw new OrderQuestionException("The language model did not answer.");
        }

        return answer.Trim().Replace("**", "", StringComparison.Ordinal);
    }

    private async Task<string?> CompleteAsync(string user, CancellationToken cancellationToken)
    {
        var client = httpClientFactory.CreateClient(HttpClientName);
        using var request = new HttpRequestMessage(HttpMethod.Post, ChatUrl(options.BaseUrl));
        if (!string.IsNullOrWhiteSpace(options.ApiKey))
        {
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", options.ApiKey.Trim());
        }

        var model = string.IsNullOrWhiteSpace(options.Model) ? "gpt-4o-mini" : options.Model.Trim();
        var body = new Dictionary<string, object?>
        {
            ["model"] = model,
            ["temperature"] = 0,
            ["messages"] = new object[]
            {
                new { role = "system", content = SystemPrompt },
                new { role = "user", content = user }
            }
        };
        if (options.BaseUrl.Contains("ollama.com", StringComparison.OrdinalIgnoreCase))
        {
            body["think"] = false;
        }

        request.Content = JsonContent.Create(body);
        using var response = await client.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            logger.LogWarning("Order question model returned {StatusCode}.", (int)response.StatusCode);
            throw new OrderQuestionException("The language model did not answer.");
        }

        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
        if (!document.RootElement.TryGetProperty("choices", out var choices) || choices.GetArrayLength() == 0)
        {
            return null;
        }

        var message = choices[0].GetProperty("message");
        return message.TryGetProperty("content", out var content) ? content.GetString() : null;
    }

    private static string ChatUrl(string baseUrl)
    {
        var trimmed = string.IsNullOrWhiteSpace(baseUrl)
            ? "https://api.openai.com/v1"
            : baseUrl.Trim().TrimEnd('/');
        return trimmed + "/chat/completions";
    }
}
