# odesli.js
Node.js Client to query Odseli.co (song.link/album.link) API

## v1.0.0

Initial release

## Installation
```
npm install odesli.js --save
```

## Initilise
```js
const Odesli = require('odesli.js');
const odesli = new Odesli();
```

## API Key
An API Key is not needed, however, you will be limited to 10 Requests per minute.
Email `developers@song.link` to get an API Key.

```js
const odesli = new Odesli({
apiKey: 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX',
version: 'vX-beta.X'
});
```

*If no version is supplied, it'll default to 'v1-alpha.1'*

## Fetch
Use `fetch()` to fetch a song by a streaming service url:

#### async/await

```js
// fetch(url: string, country?: 2-character code)
let song = await odseli.fetch('https://open.spotify.com/track/4Km5HrUvYTaSUfiSGPJeQR');
console.log(`${song.title} by ${song.artist[0]}`);

// output: Bad and Boujee by Migos
```

#### or you can use promises.

```js
// fetch(url: string, country?: 2-character code)
odseli.fetch('https://open.spotify.com/track/4Km5HrUvYTaSUfiSGPJeQR').then(song => {
console.log(`${song.title} by ${song.artist[0]}`);

// output: Bad and Boujee by Migos
});
```

## Get By Parameters
Use `getByParams()` to fetch a song by a streaming service type, song/album type, and it's unique ID:

#### async/await

```js
// getByParams(platform: string, type: enum<song|album>, id: string, country?: 2-character code)
let song = await odseli.getByParams('spotify', 'song', '4Km5HrUvYTaSUfiSGPJeQR');
console.log(song.artist[0]);

// output: Migos
```

#### or you can use promises.

```js
// getByParams(platform: string, type: enum<song|album>, id: string, country?: 2-character code)
odseli.getByParams('spotify', 'song', '4Km5HrUvYTaSUfiSGPJeQR').then(song => {
console.log(song.artist[0]);

// output: Migos
});
```

## Get By ID
Use `getById()` to fetch a song by it's unique ID:

#### async/await

```js
// // getById(id: string, country?: 2-character code)
let song = await odseli.getByParams('SPOTIFY_SONG::4Km5HrUvYTaSUfiSGPJeQR');
console.log(song.title);

// output: Bad and Boujee
```

#### or you can use promises.

```js
// getByParams(platform: string, type: enum<song|album>, id: string)
odseli.getByParams('SPOTIFY_SONG::4Km5HrUvYTaSUfiSGPJeQR').then(song => {
console.log(song.title);

// output: Bad and Boujee
});
```

## Odesli API Docs

Check the [Odesli's Public API Documentation](https://www.notion.so/Public-API-d8093b1bb8874f8b85527d985c4f9e68) for more info.
