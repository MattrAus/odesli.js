const fetch = require('node-fetch');
module.exports = class Page {
  /**
   * Create a Odesli instance
   * @param {Object} options
   * @param {string} [options.api] - Optional: 10 Request / Minute otherwise.
   * @param {string} [options.version='v1-alpha.1'] - Optional: Defaults 'v1-alpha.1'
   */
  constructor({
    api = undefined,
    version = 'v1-alpha.1'
  } = {}) {
    this.api = api || undefined;
    this.version = version || 'v1-alpha.1';
  }

  async _request(path) {
    console.log(this.api);
    console.log(this.version);
    const url = `https://api.song.link/${this.version}/${path}${this.api !== undefined ? `&key=${this.api}` : ''}`;
    console.log(url);

    async function getPage(URL) {
      try {
        const response = await fetch(URL); // Fetch the resource
        const text = await response.text(); // Parse it as text
        const data = JSON.parse(text); // Try to parse it as json
        return data;
      } catch (err) {
        if (err.message == 'Unexpected token < in JSON at position 0') throw new Error('API returned an unexpected result.');
      }
    }
    // const body = await fetch(url);
    // const result = await body.json();
    const result = getPage(url);
    // Handle errors
    if (result.statusCode) {
      // Codes in the `4xx` range indicate an error that failed given the information provided
      if (result.statusCode === 429) throw new Error(`${result.statusCode}: ${result.code}, You are being rate limited, No API Key is 10 Requests / Minute.`);
      // Codes in the `4xx` range indicate an error that failed given the information provided
      if (result.statusCode.toString().startsWith(4)) throw new Error(`${result.statusCode}: ${result.code}, Codes in the 4xx range indicate an error that failed given the information provided.`);
      // Codes in the 5xx range indicate an error with Songlink's servers.
      if (result.statusCode.toString().startsWith(5)) throw new Error(`${result.statusCode}: ${result.code}, Codes in the 5xx range indicate an error with Songlink's servers.`);
      // Otherwise if the code is not 200 (Success), throw a generic error.
      if (result.statusCode !== 200) throw new Error(`${result.statusCode}: ${result.code}`);
      // return undefined as we didn't find anything.
      return undefined;
    }
    return result;
  }

  async fetch(url, country = 'US') {
    if (!url) throw new Error('No URL was provided to odseli.fetch()');
    const path = `links?url=${encodeURIComponent(url)}&userCountry=${country}`;
    const song = await this._request(path);
    const id = song.entitiesByUniqueId[song.entityUniqueId].id;
    const title = song.entitiesByUniqueId[song.entityUniqueId].title;

    //  Convert Artist into Array for easier extraction of features
    Object.values(song.entitiesByUniqueId).forEach(function (values) {
      values.artistName = values.artistName.split(', ');
    });

    const artist = song.entitiesByUniqueId[song.entityUniqueId].artistName;
    const type = song.entitiesByUniqueId[song.entityUniqueId].type;
    const thumbnail = song.entitiesByUniqueId[song.entityUniqueId].thumbnailUrl;

    return Promise.all([song, id, title, artist, type, thumbnail]).then((result) => ({
      ...result[0],
      id: result[1],
      title: result[2],
      artist: result[3],
      type: result[4],
      thumbnail: result[5],
    })).catch((err) => {
      throw new Error(err);
    });
  }

  async getByParams(platform, type, id, country = 'US') {
    if (!platform) throw new Error('No `platform` was provided to odseli.getByParams()');
    if (!type) throw new Error('No `type` was provided to odseli.getByParams()');
    if (!id) throw new Error('No `id` was provided to odseli.getByParams()');

    // if they happen to input the full id (PLATFORM_SONG::UNIQUEID), just get the UNIQUEID
    id = id.replace(/[^::]+::/g, '');
    const path = `links?platform=${platform}&type=${type}&id=${id}&userCountry=${country}`;
    const song = await this._request(path);

    //  Convert Artist into Array for easier extraction of features
    Object.values(song.entitiesByUniqueId).forEach(function (values) {
      values.artistName = values.artistName.split(', ');
    });

    // Easier extraction of page's title, album, and thumbnail
    const title = song.entitiesByUniqueId[song.entityUniqueId].title;
    const artist = song.entitiesByUniqueId[song.entityUniqueId].artistName;
    const thumbnail = song.entitiesByUniqueId[song.entityUniqueId].thumbnailUrl;

    return Promise.all([song, title, artist, thumbnail]).then((result) => ({
      ...result[0],
      title: result[1],
      artist: result[2],
      thumbnail: result[3],
    })).catch((err) => {
      throw new Error(err);
    });
  }

  async getById(id, country = 'US') {
    if (!id) throw new Error('No `id` was provided to odseli.getById()');
    if (!id.match(/\w+_\w+::\w+/g)) throw new Error(`Provided Entity ID Does not match format. \`<PLATFORM>_<SONG|ALBUM>::<UNIQUEID>\``);

    // Convert string into seperate params
    let platform = id.replace(/_\w+::\w+/g, '').toLowerCase();
    let type = id.replace(/\w+_/g, '').replace(/::\w+/g, '').toLowerCase();
    let unique = id.replace(/\w+::/g, '');

    const path = `links?platform=${platform}&type=${type}&id=${unique}&userCountry=${country}`;
    const song = await this._request(path);

    //  Convert Artist into Array for easier extraction of features
    Object.values(song.entitiesByUniqueId).forEach(function (values) {
      values.artistName = values.artistName.split(', ');
    });

    // Easier extraction of page's title, album, and thumbnail
    const title = song.entitiesByUniqueId[song.entityUniqueId].title;
    const artist = song.entitiesByUniqueId[song.entityUniqueId].artistName;
    const thumbnail = song.entitiesByUniqueId[song.entityUniqueId].thumbnailUrl;

    return Promise.all([song, title, artist, thumbnail]).then((result) => ({
      ...result[0],
      title: result[1],
      artist: result[2],
      thumbnail: result[3],
    })).catch((err) => {
      throw new Error(err);
    });
  }
};