jest.mock('node-fetch');
const fetch = require('node-fetch');
const Odesli = require('../lib/index.js');
const { OdesliError } = Odesli;

const TEST_API_KEY = 'test-key';

// Helper to create a mock fetch response compatible with response.text()
function mockFetchResponse(data, status = 200) {
  const body =
    typeof data === 'string'
      ? data
      : JSON.stringify(data == null ? null : data);
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: {
      get: () => null,
    },
    text: jest.fn().mockResolvedValue(body),
    json: jest.fn().mockImplementation(async () => {
      if (typeof data === 'string') {
        return JSON.parse(data);
      }
      return data;
    }),
  };
}

function expectUrlWithKey(pathAndQuery) {
  const url = new URL(`https://api.song.link/v1-alpha.1/${pathAndQuery}`);
  url.searchParams.set('key', TEST_API_KEY);
  return url.toString();
}

describe('Odesli', () => {
  let odesli;
  const originalEnvKey = process.env.ODESLI_API_KEY;

  beforeEach(() => {
    delete process.env.ODESLI_API_KEY;
    odesli = new Odesli({
      apiKey: TEST_API_KEY,
      cache: false,
      retryDelay: 1,
    });
    fetch.mockReset();
  });

  afterEach(() => {
    if (originalEnvKey === undefined) {
      delete process.env.ODESLI_API_KEY;
    } else {
      process.env.ODESLI_API_KEY = originalEnvKey;
    }
  });

  describe('Constructor', () => {
    test('should throw MISSING_API_KEY without options or env', () => {
      let error;
      try {
        // eslint-disable-next-line no-new
        new Odesli();
      } catch (err) {
        error = err;
      }

      expect(error).toBeInstanceOf(OdesliError);
      expect(error.code).toBe('MISSING_API_KEY');
      expect(error.retryable).toBe(false);
      expect(error.docsUrl).toContain(
        'sunsetting-the-songlink-odesli-public-api'
      );
    });

    test('should reject whitespace-only API keys', () => {
      let error;
      try {
        // eslint-disable-next-line no-new
        new Odesli({ apiKey: '\t\n' });
      } catch (err) {
        error = err;
      }

      expect(error).toBeInstanceOf(OdesliError);
      expect(error.code).toBe('MISSING_API_KEY');
    });

    test('should create instance with custom options', () => {
      const instance = new Odesli({
        apiKey: 'test-api-key',
        version: 'v2-beta',
      });
      expect(instance.apiKey).toBe('test-api-key');
      expect(instance.version).toBe('v2-beta');
    });

    test('should create instance with partial options', () => {
      const instance = new Odesli({ apiKey: 'test-key' });
      expect(instance.apiKey).toBe('test-key');
      expect(instance.version).toBe('v1-alpha.1');
    });

    test('should fall back to process.env.ODESLI_API_KEY', () => {
      process.env.ODESLI_API_KEY = 'env-key';
      const instance = new Odesli({});
      expect(instance.apiKey).toBe('env-key');
    });

    test('should prefer options.apiKey over environment variable', () => {
      process.env.ODESLI_API_KEY = 'env-key';
      const instance = new Odesli({ apiKey: 'option-key' });
      expect(instance.apiKey).toBe('option-key');
    });

    test('should throw for null options without env key', () => {
      expect(() => new Odesli(null)).toThrow(OdesliError);
    });
  });

  describe('_request method', () => {
    test('should make request with API key via URLSearchParams', async () => {
      const mockResponse = {
        entityUniqueId: 'SPOTIFY_SONG::123',
        title: 'Test Song',
        artist: ['Test Artist'],
      };
      fetch.mockResolvedValueOnce(mockFetchResponse(mockResponse));
      const result = await odesli._request('test-path');
      expect(fetch).toHaveBeenCalledWith(
        expectUrlWithKey('test-path'),
        expect.objectContaining({
          signal: expect.any(AbortSignal),
          headers: expect.objectContaining({
            'User-Agent': expect.any(String),
            Accept: 'application/json',
          }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    test('should URL-encode API keys with special characters', async () => {
      const specialKey = 'key with spaces&more';
      const client = new Odesli({ apiKey: specialKey, cache: false });
      fetch.mockResolvedValueOnce(mockFetchResponse({ success: true }));
      await client._request('links?url=https%3A%2F%2Fexample.com');
      const calledUrl = fetch.mock.calls[0][0];
      const parsed = new URL(calledUrl);
      expect(parsed.searchParams.get('key')).toBe(specialKey);
      expect(calledUrl).not.toContain('key with spaces');
    });

    test('should handle rate limiting error', async () => {
      const client = new Odesli({
        apiKey: TEST_API_KEY,
        cache: false,
        maxRetries: 1,
      });
      const errorResponse = { statusCode: 429, code: 'RATE_LIMITED' };
      fetch.mockResolvedValueOnce(mockFetchResponse(errorResponse, 200));
      await expect(client._request('test-path')).rejects.toMatchObject({
        name: 'OdesliError',
        code: 'RATE_LIMITED',
        statusCode: 429,
        retryable: true,
      });
    });

    test('should handle 4xx errors as non-retryable', async () => {
      const errorResponse = { statusCode: 400, code: 'BAD_REQUEST' };
      fetch.mockResolvedValueOnce(mockFetchResponse(errorResponse, 200));
      await expect(odesli._request('test-path')).rejects.toMatchObject({
        name: 'OdesliError',
        code: 'BAD_REQUEST',
        statusCode: 400,
        retryable: false,
      });
    });

    test('should handle 5xx errors as retryable', async () => {
      const client = new Odesli({
        apiKey: TEST_API_KEY,
        cache: false,
        maxRetries: 3,
        retryDelay: 1,
      });
      const errorResponse = { statusCode: 500, code: 'INTERNAL_ERROR' };
      fetch.mockResolvedValue(mockFetchResponse(errorResponse, 200));
      await expect(client._request('test-path')).rejects.toMatchObject({
        name: 'OdesliError',
        code: 'INTERNAL_ERROR',
        statusCode: 500,
        retryable: true,
      });
      expect(fetch).toHaveBeenCalledTimes(3);
    });

    test('should not retry PUBLIC_API_ACCESS_DEPRECATED', async () => {
      fetch.mockResolvedValue(
        mockFetchResponse(
          { statusCode: 401, code: 'PUBLIC_API_ACCESS_DEPRECATED' },
          401
        )
      );
      await expect(odesli._request('test-path')).rejects.toMatchObject({
        name: 'OdesliError',
        code: 'PUBLIC_API_ACCESS_DEPRECATED',
        statusCode: 401,
        retryable: false,
      });
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    test('should not retry INVALID_ACCESS_KEY', async () => {
      fetch.mockResolvedValue(
        mockFetchResponse({ statusCode: 401, code: 'INVALID_ACCESS_KEY' }, 401)
      );
      await expect(odesli._request('test-path')).rejects.toMatchObject({
        name: 'OdesliError',
        code: 'INVALID_ACCESS_KEY',
        statusCode: 401,
        retryable: false,
      });
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    test('should not retry 410 Gone sunset responses', async () => {
      fetch.mockResolvedValue(
        mockFetchResponse({ statusCode: 410, code: 'GONE' }, 410)
      );
      await expect(odesli._request('test-path')).rejects.toMatchObject({
        name: 'OdesliError',
        code: 'API_SUNSET_GONE',
        statusCode: 410,
        retryable: false,
      });
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    test('should handle unexpected API response', async () => {
      const client = new Odesli({
        apiKey: TEST_API_KEY,
        cache: false,
        maxRetries: 1,
      });
      fetch.mockResolvedValueOnce(mockFetchResponse('invalid json', 200));
      await expect(client._request('test-path')).rejects.toMatchObject({
        name: 'OdesliError',
        code: 'UNEXPECTED_RESPONSE',
      });
    });

    test('should handle network errors', async () => {
      const client = new Odesli({
        apiKey: TEST_API_KEY,
        cache: false,
        maxRetries: 1,
      });
      fetch.mockReject(new Error('Network error'));
      await expect(client._request('test-path')).rejects.toMatchObject({
        name: 'OdesliError',
        code: 'NETWORK_ERROR',
        message: 'Network error',
      });
    });

    test('should handle empty path', async () => {
      const mockResponse = { success: true };
      fetch.mockResolvedValueOnce(mockFetchResponse(mockResponse));
      await odesli._request('');
      expect(fetch).toHaveBeenCalledWith(
        expectUrlWithKey(''),
        expect.any(Object)
      );
    });

    test('should handle special characters in path', async () => {
      const mockResponse = { success: true };
      fetch.mockResolvedValueOnce(mockFetchResponse(mockResponse));
      await odesli._request('test/path?param=value&other=123');
      expect(fetch).toHaveBeenCalledWith(
        expectUrlWithKey('test/path?param=value&other=123'),
        expect.any(Object)
      );
    });
  });

  describe('fetch method', () => {
    test('should fetch song by URL', async () => {
      const mockResponse = {
        entityUniqueId: 'SPOTIFY_SONG::123',
        entitiesByUniqueId: {
          'SPOTIFY_SONG::123': {
            id: '123',
            title: 'Test Song',
            artistName: 'Test Artist, Featured Artist',
            type: 'song',
            thumbnailUrl: 'https://example.com/thumb.jpg',
          },
        },
      };
      fetch.mockResolvedValueOnce(mockFetchResponse(mockResponse));
      const result = await odesli.fetch('https://open.spotify.com/track/123');
      expect(result.title).toBe('Test Song');
      expect(result.artist).toEqual(['Test Artist', 'Featured Artist']);
      expect(result.type).toBe('song');
      expect(result.thumbnail).toBe('https://example.com/thumb.jpg');
    });

    test('should fetch multiple songs by array of URLs', async () => {
      const mockResponse1 = {
        entityUniqueId: 'SPOTIFY_SONG::123',
        entitiesByUniqueId: {
          'SPOTIFY_SONG::123': {
            id: '123',
            title: 'Test Song 1',
            artistName: 'Test Artist 1',
            type: 'song',
            thumbnailUrl: 'https://example.com/thumb1.jpg',
          },
        },
      };
      const mockResponse2 = {
        entityUniqueId: 'SPOTIFY_SONG::456',
        entitiesByUniqueId: {
          'SPOTIFY_SONG::456': {
            id: '456',
            title: 'Test Song 2',
            artistName: 'Test Artist 2',
            type: 'song',
            thumbnailUrl: 'https://example.com/thumb2.jpg',
          },
        },
      };

      fetch.mockResolvedValueOnce(mockFetchResponse(mockResponse1));
      fetch.mockResolvedValueOnce(mockFetchResponse(mockResponse2));

      const urls = [
        'https://open.spotify.com/track/123',
        'https://open.spotify.com/track/456',
      ];

      const results = await odesli.fetch(urls);

      expect(Array.isArray(results)).toBe(true);
      expect(results).toHaveLength(2);
      expect(results[0].title).toBe('Test Song 1');
      expect(results[1].title).toBe('Test Song 2');
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    test('should handle errors in batch fetch', async () => {
      const client = new Odesli({
        apiKey: TEST_API_KEY,
        cache: false,
        maxRetries: 1,
        retryDelay: 1,
      });
      const urls = [
        'https://open.spotify.com/track/123',
        'https://open.spotify.com/track/invalid',
      ];
      fetch.mockResolvedValueOnce(
        mockFetchResponse({
          entityUniqueId: 'SPOTIFY_SONG::123',
          entitiesByUniqueId: {
            'SPOTIFY_SONG::123': { title: 'Test Song' },
          },
        })
      );
      fetch.mockRejectOnce(new Error('Network error'));

      const results = await client.fetch(urls);

      expect(Array.isArray(results)).toBe(true);
      expect(results).toHaveLength(2);
      expect(results[0].title).toBe('Test Song');
      expect(results[1].error).toBe('Network error');
      expect(results[1].retryable).toBe(true);
    });

    test('should enrich batch errors for sunset auth failures', async () => {
      fetch.mockResolvedValueOnce(
        mockFetchResponse(
          { statusCode: 401, code: 'PUBLIC_API_ACCESS_DEPRECATED' },
          401
        )
      );

      const results = await odesli.fetch([
        'https://open.spotify.com/track/123',
      ]);

      expect(results[0].success).toBe(false);
      expect(results[0].errorType).toBe('PUBLIC_API_ACCESS_DEPRECATED');
      expect(results[0].code).toBe('PUBLIC_API_ACCESS_DEPRECATED');
      expect(results[0].retryable).toBe(false);
    });

    test('should fetch song with custom country', async () => {
      const mockResponse = {
        entityUniqueId: 'SPOTIFY_SONG::456',
        entitiesByUniqueId: {
          'SPOTIFY_SONG::456': {
            id: '456',
            title: 'Test Song 2',
            artistName: 'Test Artist 2',
            type: 'song',
            thumbnailUrl: 'https://example.com/thumb2.jpg',
          },
        },
      };
      fetch.mockResolvedValueOnce(mockFetchResponse(mockResponse));
      await odesli.fetch('https://open.spotify.com/track/456', 'GB');
      expect(fetch).toHaveBeenCalledWith(
        expectUrlWithKey(
          'links?url=https%3A%2F%2Fopen.spotify.com%2Ftrack%2F456&userCountry=GB'
        ),
        expect.any(Object)
      );
    });

    test('should fetch batch with options', async () => {
      const mockResponse = {
        entityUniqueId: 'SPOTIFY_SONG::789',
        entitiesByUniqueId: {
          'SPOTIFY_SONG::789': {
            id: '789',
            title: 'Test Song 3',
            artistName: 'Test Artist 3',
            type: 'song',
            thumbnailUrl: 'https://example.com/thumb3.jpg',
          },
        },
      };
      fetch.mockResolvedValueOnce(mockFetchResponse(mockResponse));

      const urls = ['https://open.spotify.com/track/789'];
      const results = await odesli.fetch(urls, {
        country: 'CA',
        concurrency: 1,
        skipCache: true,
      });

      expect(Array.isArray(results)).toBe(true);
      expect(results[0].title).toBe('Test Song 3');
      expect(fetch).toHaveBeenCalledWith(
        expectUrlWithKey(
          'links?url=https%3A%2F%2Fopen.spotify.com%2Ftrack%2F789&userCountry=CA'
        ),
        expect.any(Object)
      );
    });

    test('should throw error when no URL provided', async () => {
      await expect(odesli.fetch()).rejects.toThrow(
        'No URL was provided to odesli.fetch()'
      );
    });

    test('should throw error when URL is null', async () => {
      await expect(odesli.fetch(null)).rejects.toThrow(
        'No URL was provided to odesli.fetch()'
      );
    });

    test('should return empty array when URLs array is empty', async () => {
      const results = await odesli.fetch([]);
      expect(Array.isArray(results)).toBe(true);
      expect(results).toHaveLength(0);
    });

    test('should throw error when URLs is not an array', async () => {
      await expect(odesli.fetch('not-an-array')).rejects.toThrow(
        'Invalid URL format provided to odesli.fetch()'
      );
    });
  });

  describe('getByParams method', () => {
    test('should get song by parameters', async () => {
      const mockResponse = {
        entityUniqueId: 'SPOTIFY_SONG::301',
        entitiesByUniqueId: {
          'SPOTIFY_SONG::301': {
            id: '301',
            title: 'Param Song',
            artistName: 'Param Artist',
            type: 'song',
            thumbnailUrl: 'https://example.com/thumb5.jpg',
          },
        },
      };
      fetch.mockResolvedValueOnce(mockFetchResponse(mockResponse));
      const result = await odesli.getByParams('spotify', 'song', '301');
      expect(result.title).toBe('Param Song');
      expect(result.artist).toEqual(['Param Artist']);
      expect(fetch).toHaveBeenCalledWith(
        expectUrlWithKey(
          'links?platform=spotify&type=song&id=301&userCountry=US'
        ),
        expect.any(Object)
      );
    });

    test('should handle full ID format', async () => {
      const mockResponse = {
        entityUniqueId: 'SPOTIFY_SONG::302',
        entitiesByUniqueId: {
          'SPOTIFY_SONG::302': {
            id: '302',
            title: 'Full ID Song',
            artistName: 'Full ID Artist',
            type: 'song',
            thumbnailUrl: 'https://example.com/thumb6.jpg',
          },
        },
      };
      fetch.mockResolvedValueOnce(mockFetchResponse(mockResponse));
      await odesli.getByParams('spotify', 'song', 'SPOTIFY_SONG::302');
      expect(fetch).toHaveBeenCalledWith(
        expectUrlWithKey(
          'links?platform=spotify&type=song&id=302&userCountry=US'
        ),
        expect.any(Object)
      );
    });

    test('should throw error when platform missing', async () => {
      await expect(odesli.getByParams(null, 'song', '123')).rejects.toThrow(
        'No `platform` was provided to odesli.getByParams()'
      );
    });

    test('should throw error when type missing', async () => {
      await expect(odesli.getByParams('spotify', null, '123')).rejects.toThrow(
        'No `type` was provided to odesli.getByParams()'
      );
    });

    test('should throw error when id missing', async () => {
      await expect(odesli.getByParams('spotify', 'song', null)).rejects.toThrow(
        'No `id` was provided to odesli.getByParams()'
      );
    });

    test('should handle different platforms', async () => {
      const mockResponse = {
        entityUniqueId: 'SPOTIFY_SONG::123',
        entitiesByUniqueId: {
          'SPOTIFY_SONG::123': {
            id: '123',
            title: 'Test Song',
            artistName: 'Test Artist',
            type: 'song',
            thumbnailUrl: 'https://example.com/thumb.jpg',
          },
        },
      };
      fetch.mockResolvedValueOnce(mockFetchResponse(mockResponse));
      await odesli.getByParams('spotify', 'song', '123');
      expect(fetch).toHaveBeenCalledWith(
        expectUrlWithKey(
          'links?platform=spotify&type=song&id=123&userCountry=US'
        ),
        expect.any(Object)
      );
    });

    test('should handle different types', async () => {
      const mockResponse = {
        entityUniqueId: 'SPOTIFY_ALBUM::308',
        entitiesByUniqueId: {
          'SPOTIFY_ALBUM::308': {
            id: '308',
            title: 'Test Album',
            artistName: 'Test Artist',
            type: 'album',
            thumbnailUrl: 'https://example.com/thumb.jpg',
          },
        },
      };

      fetch.mockResolvedValueOnce(mockFetchResponse(mockResponse));
      const result = await odesli.getByParams('spotify', 'album', '308');
      expect(result.type).toBe('album');
      expect(fetch).toHaveBeenCalledWith(
        expectUrlWithKey(
          'links?platform=spotify&type=album&id=308&userCountry=US'
        ),
        expect.any(Object)
      );
    });

    test('should handle special characters in ID', async () => {
      const mockResponse = {
        entityUniqueId: 'SPOTIFY_SONG::309',
        entitiesByUniqueId: {
          'SPOTIFY_SONG::309': {
            id: '309',
            title: 'Special Char Song',
            artistName: 'Special Artist',
            type: 'song',
            thumbnailUrl: 'https://example.com/thumb.jpg',
          },
        },
      };
      fetch.mockResolvedValueOnce(mockFetchResponse(mockResponse));
      await odesli.getByParams('spotify', 'song', '123-456_789');
      expect(fetch).toHaveBeenCalledWith(
        expectUrlWithKey(
          'links?platform=spotify&type=song&id=123-456_789&userCountry=US'
        ),
        expect.any(Object)
      );
    });
  });

  describe('getById method', () => {
    test('should get song by entity ID', async () => {
      const mockResponse = {
        entityUniqueId: 'SPOTIFY_SONG::401',
        entitiesByUniqueId: {
          'SPOTIFY_SONG::401': {
            id: '401',
            title: 'Entity ID Song',
            artistName: 'Entity Artist',
            type: 'song',
            thumbnailUrl: 'https://example.com/thumb7.jpg',
          },
        },
      };
      fetch.mockResolvedValueOnce(mockFetchResponse(mockResponse));
      const result = await odesli.getById('SPOTIFY_SONG::401');
      expect(result.title).toBe('Entity ID Song');
      expect(result.artist).toEqual(['Entity Artist']);
      expect(fetch).toHaveBeenCalledWith(
        expectUrlWithKey(
          'links?platform=spotify&type=song&id=401&userCountry=US'
        ),
        expect.any(Object)
      );
    });

    test('should throw error when no ID provided', async () => {
      await expect(odesli.getById()).rejects.toThrow(
        'No `id` was provided to odesli.getById()'
      );
    });

    test('should throw error when ID format is invalid', async () => {
      await expect(odesli.getById('invalid-id')).rejects.toThrow(
        'Provided Entity ID Does not match format. `<PLATFORM>_<SONG|ALBUM>::<UNIQUEID>`'
      );
    });

    test('should handle different platform formats', async () => {
      const mockResponse = {
        entityUniqueId: 'APPLEMUSIC_SONG::402',
        entitiesByUniqueId: {
          'APPLEMUSIC_SONG::402': {
            id: '402',
            title: 'Apple Music Song',
            artistName: 'Apple Artist',
            type: 'song',
            thumbnailUrl: 'https://example.com/thumb8.jpg',
          },
        },
      };
      fetch.mockResolvedValueOnce(mockFetchResponse(mockResponse));
      const result = await odesli.getById('APPLEMUSIC_SONG::402');
      expect(result.title).toBe('Apple Music Song');
      expect(fetch).toHaveBeenCalledWith(
        expectUrlWithKey(
          'links?platform=applemusic&type=song&id=402&userCountry=US'
        ),
        expect.any(Object)
      );
    });

    test('should handle album entity IDs', async () => {
      const mockResponse = {
        entityUniqueId: 'SPOTIFY_ALBUM::403',
        entitiesByUniqueId: {
          'SPOTIFY_ALBUM::403': {
            id: '403',
            title: 'Entity Album',
            artistName: 'Entity Artist',
            type: 'album',
            thumbnailUrl: 'https://example.com/thumb9.jpg',
          },
        },
      };
      fetch.mockResolvedValueOnce(mockFetchResponse(mockResponse));
      const result = await odesli.getById('SPOTIFY_ALBUM::403');
      expect(result.type).toBe('album');
      expect(fetch).toHaveBeenCalledWith(
        expectUrlWithKey(
          'links?platform=spotify&type=album&id=403&userCountry=US'
        ),
        expect.any(Object)
      );
    });

    test('should handle case insensitive platform names', async () => {
      const mockResponse = {
        entityUniqueId: 'SPOTIFY_SONG::404',
        entitiesByUniqueId: {
          'SPOTIFY_SONG::404': {
            id: '404',
            title: 'Case Insensitive Song',
            artistName: 'Case Artist',
            type: 'song',
            thumbnailUrl: 'https://example.com/thumb10.jpg',
          },
        },
      };
      fetch.mockResolvedValueOnce(mockFetchResponse(mockResponse));
      const result = await odesli.getById('spotify_song::404');
      expect(result.title).toBe('Case Insensitive Song');
      expect(fetch).toHaveBeenCalledWith(
        expectUrlWithKey(
          'links?platform=spotify&type=song&id=404&userCountry=US'
        ),
        expect.any(Object)
      );
    });
  });

  describe('Static zero-key utilities', () => {
    test('detectPlatform works without instantiating Odesli', () => {
      expect(Odesli.detectPlatform('https://open.spotify.com/track/123')).toBe(
        'spotify'
      );
      expect(
        Odesli.detectPlatform('https://music.apple.com/us/album/test/123')
      ).toBe('appleMusic');
      expect(
        Odesli.detectPlatform('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
      ).toBe('youtube');
      expect(Odesli.detectPlatform('https://invalid-url.com')).toBeNull();
    });

    test('extractId works without instantiating Odesli', () => {
      expect(
        Odesli.extractId(
          'https://open.spotify.com/track/4Km5HrUvYTaSUfiSGPJeQR'
        )
      ).toBe('4Km5HrUvYTaSUfiSGPJeQR');
      expect(
        Odesli.extractId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
      ).toBe('dQw4w9WgXcQ');
    });

    test('getSupportedPlatforms includes new live platforms', () => {
      const platforms = Odesli.getSupportedPlatforms();
      expect(platforms).toEqual(
        expect.arrayContaining([
          'spotify',
          'appleMusic',
          'audiomack',
          'anghami',
          'boomplay',
          'audius',
        ])
      );
    });

    test('getPageUrl builds song.link landing URLs', () => {
      const url = 'https://open.spotify.com/track/4Km5HrUvYTaSUfiSGPJeQR';
      expect(Odesli.getPageUrl(url)).toBe(`https://song.link/${url}`);
    });

    test('getPageUrl rejects invalid URLs', () => {
      expect(() => Odesli.getPageUrl('not-a-url')).toThrow(OdesliError);
      expect(() => Odesli.getPageUrl('')).toThrow(OdesliError);
    });

    test('instance methods delegate to static helpers', () => {
      const url = 'https://open.spotify.com/track/123';
      expect(odesli.detectPlatform(url)).toBe(Odesli.detectPlatform(url));
      expect(odesli.extractId(url)).toBe(Odesli.extractId(url));
      expect(odesli.getSupportedPlatforms()).toEqual(
        Odesli.getSupportedPlatforms()
      );
      expect(odesli.getPageUrl(url)).toBe(Odesli.getPageUrl(url));
    });

    test('supports CommonJS named destructuring exports', () => {
      const {
        Odesli: NamedOdesli,
        OdesliError: NamedError,
        SUNSET_DOCS_URL,
      } = require('../lib/index.js');
      expect(NamedOdesli).toBe(Odesli);
      expect(NamedError).toBe(OdesliError);
      expect(SUNSET_DOCS_URL).toContain(
        'sunsetting-the-songlink-odesli-public-api'
      );
    });

    test('never leaks API key into logger output', async () => {
      const logged = [];
      const secretKey = 'super-secret-api-key-value';
      const client = new Odesli({
        apiKey: secretKey,
        cache: false,
        maxRetries: 1,
        logger: msg => logged.push(msg),
      });
      fetch.mockResolvedValueOnce(
        mockFetchResponse({ statusCode: 401, code: 'INVALID_ACCESS_KEY' }, 401)
      );
      await expect(
        client.fetch('https://open.spotify.com/track/123')
      ).rejects.toThrow(OdesliError);
      expect(logged.length).toBeGreaterThan(0);
      logged.forEach(msg => {
        expect(msg).not.toContain(secretKey);
      });
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    test('should handle malformed API response', async () => {
      const malformedResponse = {
        entityUniqueId: 'SPOTIFY_SONG::501',
        entitiesByUniqueId: {
          'SPOTIFY_SONG::501': {
            // Missing required fields
          },
        },
      };
      fetch.mockResolvedValueOnce(mockFetchResponse(malformedResponse));
      const result = await odesli.fetch('https://open.spotify.com/track/501');
      expect(result.title).toBeUndefined();
      expect(result.artist).toBeUndefined();
    });

    test('should handle multiple entities in response', async () => {
      const mockResponse = {
        entityUniqueId: 'SPOTIFY_SONG::502',
        entitiesByUniqueId: {
          'SPOTIFY_SONG::502': {
            id: '502',
            title: 'Main Song',
            artistName: 'Main Artist',
            type: 'song',
            thumbnailUrl: 'https://example.com/thumb.jpg',
          },
          'APPLEMUSIC_SONG::503': {
            id: '503',
            title: 'Same Song',
            artistName: 'Same Artist',
            type: 'song',
            thumbnailUrl: 'https://example.com/thumb2.jpg',
          },
        },
      };
      fetch.mockResolvedValueOnce(mockFetchResponse(mockResponse));
      const result = await odesli.fetch('https://open.spotify.com/track/502');
      expect(result.title).toBe('Main Song');
    });

    test('should handle empty entitiesByUniqueId', async () => {
      const mockResponse = {
        entityUniqueId: 'SPOTIFY_SONG::504',
        entitiesByUniqueId: {},
      };
      fetch.mockResolvedValueOnce(mockFetchResponse(mockResponse));
      const result = await odesli.fetch('https://open.spotify.com/track/504');
      expect(result.title).toBeUndefined();
    });

    test('should handle missing entityUniqueId in response', async () => {
      const mockResponse = {
        entitiesByUniqueId: {
          'SPOTIFY_SONG::505': {
            id: '505',
            title: 'Missing Entity Song',
            artistName: 'Missing Artist',
            type: 'song',
            thumbnailUrl: 'https://example.com/thumb.jpg',
          },
        },
      };
      fetch.mockResolvedValueOnce(mockFetchResponse(mockResponse));
      const result = await odesli.fetch('https://open.spotify.com/track/505');
      expect(result.title).toBeUndefined();
    });
  });

  describe('getCountryOptions method', () => {
    test('should return array of country options', () => {
      const countryOptions = Odesli.getCountryOptions();
      expect(Array.isArray(countryOptions)).toBe(true);
      expect(countryOptions.length).toBeGreaterThan(0);
    });

    test('should return objects with code and name properties', () => {
      const countryOptions = Odesli.getCountryOptions();
      const firstCountry = countryOptions[0];
      expect(firstCountry).toHaveProperty('code');
      expect(firstCountry).toHaveProperty('name');
      expect(typeof firstCountry.code).toBe('string');
      expect(typeof firstCountry.name).toBe('string');
    });

    test('should include popular countries', () => {
      const countryOptions = Odesli.getCountryOptions();
      const codes = countryOptions.map(c => c.code);
      expect(codes).toContain('US');
      expect(codes).toContain('GB');
      expect(codes).toContain('CA');
      expect(codes).toContain('AU');
      expect(codes).toContain('DE');
    });

    test('should have valid ISO 3166-1 alpha-2 codes', () => {
      const countryOptions = Odesli.getCountryOptions();
      countryOptions.forEach(country => {
        expect(country.code).toMatch(/^[A-Z]{2}$/);
      });
    });

    test('should have unique country codes', () => {
      const countryOptions = Odesli.getCountryOptions();
      const codes = countryOptions.map(c => c.code);
      const uniqueCodes = [...new Set(codes)];
      expect(codes).toHaveLength(uniqueCodes.length);
    });

    test('should have non-empty country names', () => {
      const countryOptions = Odesli.getCountryOptions();
      countryOptions.forEach(country => {
        expect(country.name.trim().length).toBeGreaterThan(0);
      });
    });
  });

  describe('Country code validation', () => {
    test('should accept valid country codes', async () => {
      const mockResponse = {
        entityUniqueId: 'SPOTIFY_SONG::123',
        entitiesByUniqueId: {
          'SPOTIFY_SONG::123': {
            id: '123',
            title: 'Test Song',
            artistName: 'Test Artist',
            type: 'song',
            thumbnailUrl: 'https://example.com/thumb.jpg',
          },
        },
      };
      fetch.mockResolvedValueOnce(mockFetchResponse(mockResponse));

      const result = await odesli.fetch('https://open.spotify.com/track/123', {
        country: 'US',
      });
      expect(result.title).toBe('Test Song');
    });

    test('should accept multiple valid country codes', async () => {
      const mockResponse = {
        entityUniqueId: 'SPOTIFY_SONG::123',
        entitiesByUniqueId: {
          'SPOTIFY_SONG::123': {
            id: '123',
            title: 'Test Song',
            artistName: 'Test Artist',
            type: 'song',
            thumbnailUrl: 'https://example.com/thumb.jpg',
          },
        },
      };
      fetch.mockResolvedValue(mockFetchResponse(mockResponse));

      const validCountries = ['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'JP'];

      for (const country of validCountries) {
        await odesli.fetch('https://open.spotify.com/track/123', {
          country,
        });
      }

      expect(fetch).toHaveBeenCalledTimes(validCountries.length);
    });

    test('should handle batch requests with country codes', async () => {
      const mockResponse = {
        entityUniqueId: 'SPOTIFY_SONG::123',
        entitiesByUniqueId: {
          'SPOTIFY_SONG::123': {
            id: '123',
            title: 'Test Song',
            artistName: 'Test Artist',
            type: 'song',
            thumbnailUrl: 'https://example.com/thumb.jpg',
          },
        },
      };
      fetch.mockResolvedValue(mockFetchResponse(mockResponse));

      const urls = [
        'https://open.spotify.com/track/123',
        'https://music.apple.com/us/album/test/456?i=789',
      ];

      const results = await odesli.fetch(urls, { country: 'GB' });
      expect(results).toHaveLength(2);
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Cache & Metrics Integration', () => {
    test('should support metrics: true boolean option, record hits/misses, and redact apiKey', async () => {
      const secretKey = 'secret-unit-test-key-999';
      const client = new Odesli({
        apiKey: secretKey,
        cache: true,
        metrics: true,
      });
      client.clearCache();

      const mockResponse = {
        entityUniqueId: 'SPOTIFY_SONG::123',
        pageUrl: 'https://song.link/s/123',
        entitiesByUniqueId: {
          'SPOTIFY_SONG::123': {
            id: '123',
            title: 'Test Song',
            artistName: 'Test Artist',
            type: 'song',
            thumbnailUrl: 'https://example.com/thumb.jpg',
          },
        },
        linksByPlatform: {},
      };
      fetch.mockResolvedValue(mockFetchResponse(mockResponse));

      await client.fetch('https://open.spotify.com/track/123');
      await client.fetch('https://open.spotify.com/track/123');

      const cacheStats = client.getCacheStats();
      expect(cacheStats.missCount).toBe(1);
      expect(cacheStats.hitCount).toBe(1);
      expect(cacheStats.size).toBeGreaterThanOrEqual(1);

      const metricsJson = JSON.stringify(client.getMetrics().export('json'));
      expect(metricsJson).not.toContain(secretKey);

      client.clearCache();
      expect(client.getCacheStats().size).toBe(0);
    });
  });
});
