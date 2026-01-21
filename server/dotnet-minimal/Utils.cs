using Microsoft.AspNetCore.Cors.Infrastructure;
using Microsoft.Extensions.DependencyInjection;

internal static class Utils
{
    private static readonly string[] Colors =
    {
        "#e63946", "#2a9d8f", "#e9c46a", "#f4a261", "#264653", "#9b5de5", "#00bbf9",
        "#00f5d4", "#f15bb5", "#06d6a0", "#118ab2", "#ef476f", "#ffd166", "#8338ec",
        "#3a86ff", "#ff6d00", "#ff5400", "#7c3aed", "#16a34a", "#0ea5e9", "#22c55e",
        "#f97316", "#e11d48", "#14b8a6", "#8b5cf6", "#f43f5e", "#84cc16", "#0891b2",
        "#fb7185"
    };

    internal static void AddDefaultCors(WebApplicationBuilder builder)
    {
        builder.Services.AddCors(options =>
        {
            options.AddDefaultPolicy(policy =>
            {
                policy.WithOrigins("http://localhost:8080")
                      .AllowAnyHeader()
                      .AllowAnyMethod();
            });
        });
    }

    internal static string GetRandomColor()
    {
        return Colors[Random.Shared.Next(Colors.Length)];
    }
}
