jest.mock('node-fetch');
const fetch = require('node-fetch');
const Odesli = require('../lib/index.js');

// Helper to create a mock fetch response
function mockFetchResponse(data, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: jest.fn().mockResolvedValue(data),
  };
}

describe('Odesli', () => {
  let odesli;

  beforeEach(() => {
    // Disable caching for tests to avoid interference
    odesli = new Odesli({ cache: false });
    fetch.mockReset();
  });

  describe('Constructor', () => {
    test('should create instance with default options', () => {
      const instance = new Odesli();
      expect(instance.apiKey).toBeUndefined();
      expect(instance.version).toBe('v1-alpha.1');
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

    test('should handle empty options object', () => {
      const instance = new Odesli({});
      expect(instance.apiKey).toBeUndefined();
      expect(instance.version).toBe('v1-alpha.1');
    });

    test('should handle null/undefined options', () => {
      const instance1 = new Odesli(null);
      const instance2 = new Odesli(undefined);
      expect(instance1.apiKey).toBeUndefined();
      expect(instance1.version).toBe('v1-alpha.1');
      expect(instance2.apiKey).toBeUndefined();
      expect(instance2.version).toBe('v1-alpha.1');
    });
  });

  describe('_request method', () => {
    test('should make request without API key', async () => {
      const mockResponse = {
        entityUniqueId: 'SPOTIFY_SONG::123',
        title: 'Test Song',
        artist: ['Test Artist'],
      };
      fetch.mockResolvedValueOnce(mockFetchResponse(mockResponse));
      const result = await odesli._request('test-path');
      expect(fetch).toHaveBeenCalledWith(
        'https://api.song.link/v1-alpha.1/test-path',
        expect.objectContaining({
          signal: expect.any(AbortSignal),
          headers: expect.objectContaining({
            'User-Agent': expect.stringContaining('@mattraus/odesli.js'),
            Accept: 'application/json',
          }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    test('should make request with API key', async () => {
      const odesliWithKey = new Odesli({ apiKey: 'test-key', cache: false });
      const mockResponse = { success: true };
      fetch.mockResolvedValueOnce(mockFetchResponse(mockResponse));
      await odesliWithKey._request('test-path');
      expect(fetch).toHaveBeenCalledWith(
        'https://api.song.link/v1-alpha.1/test-path&key=test-key',
        expect.any(Object)
      );
    });

    test('should handle rate limiting error', async () => {
      const errorResponse = { statusCode: 429, code: 'RATE_LIMITED' };
      fetch.mockResolvedValueOnce(mockFetchResponse(errorResponse, 200));
      await expect(odesli._request('test-path')).rejects.toThrow(
        '429: RATE_LIMITED, You are being rate limited, No API Key is 10 Requests / Minute.'
      );
    });

    test('should handle 4xx errors', async () => {
      const errorResponse = { statusCode: 400, code: 'BAD_REQUEST' };
      fetch.mockResolvedValueOnce(mockFetchResponse(errorResponse, 200));
      await expect(odesli._request('test-path')).rejects.toThrow(
        '400: BAD_REQUEST, Codes in the 4xx range indicate an error that failed given the information provided.'
      );
    });

    test('should handle 5xx errors', async () => {
      const errorResponse = { statusCode: 500, code: 'INTERNAL_ERROR' };
      fetch.mockResolvedValueOnce(mockFetchResponse(errorResponse, 200));
      await expect(odesli._request('test-path')).rejects.toThrow(
        "500: INTERNAL_ERROR, Codes in the 5xx range indicate an error with Songlink's servers."
      );
    });

    test('should handle unexpected API response', async () => {
      fetch.mockResponseOnce('invalid json');
      await expect(odesli._request('test-path')).rejects.toThrow(
        'invalid json response body'
      );
    });

    test('should handle network errors', async () => {
      fetch.mockReject(new Error('Network error'));
      await expect(odesli._request('test-path')).rejects.toThrow(
        'Network error'
      );
    });

    test('should handle empty path', async () => {
      const mockResponse = { success: true };
      fetch.mockResolvedValueOnce(mockFetchResponse(mockResponse));
      await odesli._request('');
      expect(fetch).toHaveBeenCalledWith(
        'https://api.song.link/v1-alpha.1/',
        expect.any(Object)
      );
    });

    test('should handle special characters in path', async () => {
      const mockResponse = { success: true };
      fetch.mockResolvedValueOnce(mockFetchResponse(mockResponse));
      await odesli._request('test/path?param=value&other=123');
      expect(fetch).toHaveBeenCalledWith(
        'https://api.song.link/v1-alpha.1/test/path?param=value&other=123',
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
      const urls = [
        'https://open.spotify.com/track/123',
        'https://open.spotify.com/track/invalid',
      ];
      fetch.mockResponseOnce(
        JSON.stringify({
          entityUniqueId: 'SPOTIFY_SONG::123',
          entitiesByUniqueId: {
            'SPOTIFY_SONG::123': { title: 'Test Song' },
          },
        })
      );
      fetch.mockRejectOnce(new Error('Network error'));

      const results = await odesli.fetch(urls);

      expect(Array.isArray(results)).toBe(true);
      expect(results).toHaveLength(2);
      expect(results[0].title).toBe('Test Song');
      expect(results[1].error).toBe('Network error');
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
        'https://api.song.link/v1-alpha.1/links?url=https%3A%2F%2Fopen.spotify.com%2Ftrack%2F456&userCountry=GB',
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
        'https://api.song.link/v1-alpha.1/links?url=https%3A%2F%2Fopen.spotify.com%2Ftrack%2F789&userCountry=CA',
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
        'https://api.song.link/v1-alpha.1/links?platform=spotify&type=song&id=301&userCountry=US',
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
        'https://api.song.link/v1-alpha.1/links?platform=spotify&type=song&id=302&userCountry=US',
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
        'https://api.song.link/v1-alpha.1/links?platform=spotify&type=song&id=123&userCountry=US',
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
        'https://api.song.link/v1-alpha.1/links?platform=spotify&type=album&id=308&userCountry=US',
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
        'https://api.song.link/v1-alpha.1/links?platform=spotify&type=song&id=123-456_789&userCountry=US',
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
        'https://api.song.link/v1-alpha.1/links?platform=spotify&type=song&id=401&userCountry=US',
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
        'https://api.song.link/v1-alpha.1/links?platform=applemusic&type=song&id=402&userCountry=US',
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
        'https://api.song.link/v1-alpha.1/links?platform=spotify&type=album&id=403&userCountry=US',
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
        'https://api.song.link/v1-alpha.1/links?platform=spotify&type=song&id=404&userCountry=US',
        expect.any(Object)
      );
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
      // Should only process the main entity, not all entities
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

      // Should have made requests for each country
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
});
