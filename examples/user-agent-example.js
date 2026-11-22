// Requires an allowlisted Songlink/Odesli API key (public API retired July 31, 2026).
const Odesli = require('odesli.js');

async function userAgentExample() {
  console.log('🌐 Odesli.js User-Agent Example\n');

  if (!process.env.ODESLI_API_KEY) {
    console.error(
      'Missing ODESLI_API_KEY. Set an allowlisted key before running this example.'
    );
    process.exit(1);
  }

  // Initialize the client with an allowlisted API key
  const odesli = new Odesli({
    apiKey: process.env.ODESLI_API_KEY,
  });

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
    apiKey: process.env.ODESLI_API_KEY,
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
