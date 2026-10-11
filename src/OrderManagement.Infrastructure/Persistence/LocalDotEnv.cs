using Microsoft.Extensions.Configuration;

namespace OrderManagement.Infrastructure.Persistence;

public static class LocalDotEnv
{
    public static void ApplyOrdersConnection(IConfigurationManager configuration, string contentRootPath)
    {
        if (!string.IsNullOrWhiteSpace(configuration.GetConnectionString("Orders")))
        {
            return;
        }

        var connectionString = TryReadOrdersConnectionString(contentRootPath);
        if (connectionString is null)
        {
            return;
        }

        configuration.AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["ConnectionStrings:Orders"] = connectionString
        });
    }

    public static string? TryReadOrdersConnectionString(string startDirectory)
    {
        var configured = Environment.GetEnvironmentVariable("ConnectionStrings__Orders");
        if (!string.IsNullOrWhiteSpace(configured))
        {
            return configured;
        }

        var envFile = FindEnvFile(startDirectory);
        if (envFile is null)
        {
            return null;
        }

        var values = Parse(envFile);
        if (values.TryGetValue("ConnectionStrings__Orders", out var connectionString)
            && !string.IsNullOrWhiteSpace(connectionString))
        {
            return connectionString;
        }

        if (!values.TryGetValue("POSTGRES_USER", out var user)
            || !values.TryGetValue("POSTGRES_PASSWORD", out var password)
            || !values.TryGetValue("POSTGRES_DB", out var database))
        {
            return null;
        }

        var port = values.GetValueOrDefault("POSTGRES_PORT");
        if (string.IsNullOrWhiteSpace(port))
        {
            port = "5432";
        }

        return $"Host=localhost;Port={port};Database={database};Username={user};Password={password}";
    }

    private static string? FindEnvFile(string startDirectory)
    {
        var directory = new DirectoryInfo(startDirectory);
        while (directory is not null)
        {
            var candidate = Path.Combine(directory.FullName, ".env");
            if (File.Exists(candidate))
            {
                return candidate;
            }

            directory = directory.Parent;
        }

        return null;
    }

    private static Dictionary<string, string> Parse(string path)
    {
        var values = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var line in File.ReadAllLines(path))
        {
            var trimmed = line.Trim();
            if (trimmed.Length == 0 || trimmed.StartsWith('#'))
            {
                continue;
            }

            var separator = trimmed.IndexOf('=');
            if (separator <= 0)
            {
                continue;
            }

            var key = trimmed[..separator].Trim();
            var value = trimmed[(separator + 1)..].Trim().Trim('"');
            values[key] = value;
        }

        return values;
    }
}
