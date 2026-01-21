var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddHttpClient();
Utils.AddDefaultCors(builder);

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// app.UseHttpsRedirection();

app.UseCors();

app.MapGet("/", () => Results.Text("Welcome to the Telenor Test API"));

app.MapGet("/wikipedia", async (IHttpClientFactory httpClientFactory) => {
    var title = "Norge";
    // Use MediaWiki API with extracts - fetch plenty of content, then limit to 500 words
    var url = $"https://no.wikipedia.org/w/api.php?action=query&titles={Uri.EscapeDataString(title)}&prop=extracts&exintro=false&explaintext=true&format=json";

    var client = httpClientFactory.CreateClient();
    client.DefaultRequestHeaders.Add("User-Agent", "TelenorTestApp/1.0");

    var response = await client.GetAsync(url);
    if (!response.IsSuccessStatusCode)
    {
        return Results.Problem("Failed to fetch Wikipedia data");
    }

    var json = await response.Content.ReadFromJsonAsync<MediaWikiResponse>();
    var page = json?.Query?.Pages?.Values.FirstOrDefault();
    var extract = page?.Extract ?? "";

    // Limit to exactly 500 words
    var words = extract.Split(' ', StringSplitOptions.RemoveEmptyEntries);
    var limitedText = string.Join(" ", words.Take(500));

    return Results.Json(new { title = page?.Title ?? title, extract = limitedText });
});

app.MapPost("/format", (FormatRequest request) => {
    if (string.IsNullOrEmpty(request.SelectedText))
    {
        return Results.BadRequest("selectedText is required");
    }

    // Generate random vibrant color
    var color = Utils.GetRandomColor();

    // Capitalize first letter of each word
    var formattedText = CapitalizeWords(request.SelectedText);

    return Results.Json(new { formattedText, color });
});

static string CapitalizeWords(string text)
{
    if (string.IsNullOrEmpty(text)) return text;

    var words = text.Split(' ');
    for (int i = 0; i < words.Length; i++)
    {
        if (words[i].Length > 0)
        {
            words[i] = char.ToUpper(words[i][0]) + words[i].Substring(1);
        }
    }
    return string.Join(" ", words);
}

app.MapFallback(() => Results.Text("Page/endpoint not found", statusCode: 404));

app.Run();

record MediaWikiResponse(MediaWikiQuery? Query);
record MediaWikiQuery(Dictionary<string, MediaWikiPage>? Pages);
record MediaWikiPage(string? Title, string? Extract);
record FormatRequest(string? SelectedText);

// Make the implicit Program class accessible for testing
public partial class Program { }
