using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace dotnet_minimal.Tests;

public class FormatEndpointTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public FormatEndpointTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Format_CapitalizesFirstLetterOfEachWord()
    {
        var response = await _client.PostAsJsonAsync("/format", new { selectedText = "hello world" });

        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadFromJsonAsync<FormatResponse>();

        Assert.Equal("Hello World", result?.FormattedText);
    }

    [Fact]
    public async Task Format_ReturnsColor()
    {
        var response = await _client.PostAsJsonAsync("/format", new { selectedText = "test" });

        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadFromJsonAsync<FormatResponse>();

        Assert.NotNull(result?.Color);
        Assert.StartsWith("#", result.Color);
    }

    [Fact]
    public async Task Format_HandlesMultipleWords()
    {
        var response = await _client.PostAsJsonAsync("/format", new { selectedText = "the quick brown fox" });

        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadFromJsonAsync<FormatResponse>();

        Assert.Equal("The Quick Brown Fox", result?.FormattedText);
    }

    [Fact]
    public async Task Format_PreservesAlreadyCapitalizedWords()
    {
        var response = await _client.PostAsJsonAsync("/format", new { selectedText = "Hello World" });

        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadFromJsonAsync<FormatResponse>();

        Assert.Equal("Hello World", result?.FormattedText);
    }

    [Fact]
    public async Task Format_HandlesSingleWord()
    {
        var response = await _client.PostAsJsonAsync("/format", new { selectedText = "test" });

        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadFromJsonAsync<FormatResponse>();

        Assert.Equal("Test", result?.FormattedText);
    }

    [Fact]
    public async Task Format_ReturnsBadRequest_WhenSelectedTextMissing()
    {
        var response = await _client.PostAsJsonAsync("/format", new { selectedText = (string?)null });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Format_ReturnsBadRequest_WhenSelectedTextEmpty()
    {
        var response = await _client.PostAsJsonAsync("/format", new { selectedText = "" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task FormatColor_ReturnsValidColor()
    {
        var response = await _client.GetAsync("/format/color");

        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadFromJsonAsync<ColorResponse>();

        Assert.NotNull(result?.Color);
        Assert.StartsWith("#", result.Color);
        Assert.Equal(7, result.Color.Length);
    }

    [Fact]
    public async Task Root_ReturnsWelcomeMessage()
    {
        var response = await _client.GetAsync("/");

        response.EnsureSuccessStatusCode();
        var content = await response.Content.ReadAsStringAsync();

        Assert.Contains("Welcome", content);
    }

    private record FormatResponse(string? FormattedText, string? Color);
    private record ColorResponse(string? Color);
}
