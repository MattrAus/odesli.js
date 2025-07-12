// Example: No API key is used. You are limited to 10 requests/minute. Some requests may return 401/429 if the rate limit is exceeded.
const Odesli = require('odesli.js');

async function userAgentExample() {
  console.log('🌐 Odesli.js User-Agent Example\n');

  // Initialize the client (no API key)
  const odesli = new Odesli();

  // Display the User-Agent string
  console.log('Current User-Agent:');
  console.log(odesli.getUserAgent());
  console.log();

  // Show package information
  console.log('Package Information:');
  console.log(`Name: ${require('../package.json').name}`);
  console.log(`Version: ${require('../package.json').version}`);
  console.log(`Node.js: ${process.version}`);
  console.log(`Platform: ${process.platform}`);
  console.log();

  // Example of how the User-Agent looks in requests
  console.log('The User-Agent will be sent with every API request:');
  console.log(`GET https://api.song.link/v1-alpha.1/links?...`);
  console.log(`User-Agent: ${odesli.getUserAgent()}`);
  console.log();

  // Test with custom headers
  console.log('With custom headers:');
  const odesliWithCustomHeaders = new Odesli({
    headers: {
      'X-Custom-Header': 'MyApp/1.0',
      'User-Agent': 'CustomUserAgent/1.0', // This will override the default
    },
  });

  console.log('Custom User-Agent (overridden):');
  console.log(odesliWithCustomHeaders.getUserAgent());
  console.log(
    'Note: The custom User-Agent in headers will be used instead of the default one.'
  );
}

// Run the example
userAgentExample().catch(console.error);
