# Examples

This directory contains example code showing how to use the `odesli.js` package.

## Basic Usage

Run the basic example to see how to fetch song information:

```bash
node examples/basic-usage.js
```

This example shows:

- Initializing the Odesli client
- Fetching a song by URL
- Displaying song information
- Showing available streaming platforms

## Advanced Usage

Run the advanced example to see more complex scenarios:

```bash
node examples/advanced-usage.js
```

- By default, this will run without an API key and is limited to 10 requests per minute.
- If you need to make more than 10 requests per minute, set your API key as an environment variable:

```bash
export ODESLI_API_KEY=your-api-key-here
node examples/advanced-usage.js
```

This example shows:

- Using an API key for higher rate limits (optional)
- Fetching songs for different countries
- Using different methods (fetch, getByParams, getById)
- Processing multiple songs in parallel
- Error handling

## Getting an API Key

An API key is **not required** for most users or for running these examples. You only need an API key if you want to make more than 10 requests per minute (for production or high-volume use). To get an API key for higher rate limits, email `developers@song.link`.

## Note

The examples use real API calls, so you may be rate-limited if you make more than 10 requests per minute without an API key. The basic example should work with the free tier (10 requests/minute).
