namespace OrderManagement.Infrastructure.Insights;

public sealed class LlmOptions
{
    public const string SectionName = "Llm";

    public string BaseUrl { get; init; } = "https://api.openai.com/v1";

    public string ApiKey { get; init; } = "";

    public string Model { get; init; } = "gpt-4o-mini";

    public bool IsEnabled =>
        !string.IsNullOrWhiteSpace(ApiKey)
        || !BaseUrl.Contains("api.openai.com", StringComparison.OrdinalIgnoreCase);
}
