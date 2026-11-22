jest.dontMock('node-fetch');

const Odesli = require('../lib/index.js');

const shouldRunLive =
  process.env.ODESLI_RUN_LIVE_TESTS === '1' &&
  Boolean(process.env.ODESLI_API_KEY && process.env.ODESLI_API_KEY.trim());

const describeLive = shouldRunLive ? describe : describe.skip;

describeLive('Odesli live API contract', () => {
  test('fetches a known Spotify track with an allowlisted key', async () => {
    const odesli = new Odesli({
      apiKey: process.env.ODESLI_API_KEY,
      cache: false,
      metrics: false,
    });

    const song = await odesli.fetch(
      'https://open.spotify.com/track/4Km5HrUvYTaSUfiSGPJeQR'
    );

    expect(song).toBeTruthy();
    expect(song.pageUrl).toMatch(/^https:\/\/song\.link\//);
    expect(song.title).toBeTruthy();
    expect(Array.isArray(song.artist)).toBe(true);
    expect(song.linksByPlatform).toBeTruthy();
    expect(Object.keys(song.linksByPlatform).length).toBeGreaterThan(0);
  }, 20000);
});
