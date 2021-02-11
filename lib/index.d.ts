// Type definitions for odesli.js
// Project: https://github.com/MattrAus/odesli.js, https://www.npmjs.com/package/odesli.js
// Definitions by: Mattr <https://github.com/MattrAus>
// TypeScript Version: 2.7

declare class Odesli {
    /**
    * 
    * @param {string=} apiKey Limited to 10 Requests per Minute without an API Key.
    *
    * Email `developers@song.link` to get an API Key.
    * 
    * @param {string=} version Defaults to `v1-alpha.1`
    */
    constructor(options?: {
        /**
         * @param {string=} apiKey Optional: Limited to 10 Requests per Minute without an API Key.
         * 
         * Email `developers@song.link` to get an API Key.
         */
        apiKey?: string
        /**
         * @param {string=} version Optional: Defaults to `v1-alpha.1`
         */
        version?: 'v1-alpha.1' | string
    });

    /**
     * 
     * @param {string} url Streaming service URL
     * @param {CountryCode} [country='US'] Optional: [ISO 3166-1 Alpha-2 Code](https://www.iso.org/obp/ui/#search/code/)
     * @returns Promise<Page.Response>
     */
    fetch(url: string, country?: CountryCode | 'US'): Promise<Page.Response>;

    /**
     * 
     * @param {Platform} platform Streaming service
     * @param {entityType} type Type: song or album
     * @param {string} id Type: song or album
     * @param {CountryCode} [country='US'] Optional: [ISO 3166-1 Alpha-2 Code](https://www.iso.org/obp/ui/#search/code/)
     * @returns Promise<Page.Response>
     */
    getByParams(platform: string, type: entityType, id: string, country?: CountryCode): Promise<Page.Response>;

    /**
     * 
     * @param url Streaming service URL
     * @param {CountryCode} [country='US'] Optional: [ISO 3166-1 Alpha-2 Code](https://www.iso.org/obp/ui/#search/code/)
     * @returns Promise<Page.Response>
     */
    getById(id: string, country?: CountryCode): Promise<Page.Response>;
}

declare namespace Page {
    interface Response {
        /**
         * The unique ID for the input entity that was supplied in the request. 
         * 
         * The data for this entity, such as title, artistName, etc. will be found in an object at `entitiesByUniqueId[entityUniqueId]`
        */
        entityUniqueId: string,

        /**
         * Song/Album Title of the given response, same as `Response.entitiesByUniqueId[Response.entityUniqueId].title`
        */
        title: string,

        /**
         * Artist's Name of the given response, same as `Response.entitiesByUniqueId[Response.entityUniqueId].artistName`
        */
        artist: string,

        /**
         * Type (song or album) of the given response, same as `Response.entitiesByUniqueId[Response.entityUniqueId].type`
        */
        type: entityType,

        /**
         * Thumbnail of the given response, same as `Response.entitiesByUniqueId[Response.entityUniqueId].thumbnailUrl`
        */
        thumbnail: string,

        /**
         * The userCountry query param that was supplied in the request. It signals
         * the country/availability we use to query the streaming platforms. Defaults
         * to 'US' if no userCountry supplied in the request.
         * 
         * NOTE: As a fallback, our service may respond with matches that were found
         * in a locale other than the userCountry supplied
        */
        userCountry: CountryCode,

        /**
         * A URL that will render the Songlink page for this entity
        */
        pageUrl: string,

        /**
         * A collection of objects. Each key is a platform, and each value is an
         * object that contains data for linking to the match
        */
        linksByPlatform: {
            /**
             * Each key in `linksByPlatform` is a Platform. A Platform will exist here
            * only if there is a match found. E.g. if there is no YouTube match found,
            * then neither `youtube` or `youtubeMusic` properties will exist here
            */
            [key in Platform]: {
                /** 
                * The unique ID for this entity. Use it to look up data about this entity
                * at `entitiesByUniqueId[entityUniqueId]`
                */
                entityUniqueId: string,

                /** 
                 * The URL for this match
                 */
                url: string,

                /**
                 * The native app URI that can be used on mobile devices to open this
                * entity directly in the native app
                */
                nativeAppUriMobile?: string,

                /**
                 * The native app URI that can be used on desktop devices to open this
                * entity directly in the native app
                */
                nativeAppUriDesktop?: string,
            };
        },

        /**
         * A collection of objects. Each key is a unique identifier for a streaming
        * entity, and each value is an object that contains data for that entity,
        * such as `title`, `artistName`, `thumbnailUrl`, etc.
        */
        entitiesByUniqueId: {
            /**
             * The unique identifier key for a streaming entitiy
             */
            [entityUniqueId: string]: {
                /**
                 * This is the unique identifier on the streaming platform/API provider
                 */
                id: string,

                /**
                 * The type of media this entity is
                 */
                type: entityType,

                /**
                 * The title of the `song`/`album`
                 */
                title?: string,

                /**
                 * The artist/s of the `song`/`album`
                 */
                artistName?: [string],

                /**
                 * The coverart image URL of the `song`/`album`
                 */
                thumbnailUrl?: string,

                /**
                 * Coverart's width
                 */
                thumbnailWidth?: number,
                /**
                 * Coverart's height
                 */
                thumbnailHeight?: number,

                /**
                 * The API provider that powered this match. Useful if you'd like to use
                * this entity's data to query the API directly
                */
                apiProvider: APIProvider,

                /**
                 * An array of platforms that are "powered" by this entity. E.g. an entity
                * from Apple Music will generally have a `platforms` array of
                * `["appleMusic", "itunes"]` since both those platforms/links are derived
                * from this single entity
                */
                platforms: Platform[],
            },
        },
    }
}

type Platform =
    | 'spotify'
    | 'itunes'
    | 'appleMusic'
    | 'youtube'
    | 'youtubeMusic'
    | 'google'
    | 'googleStore'
    | 'pandora'
    | 'deezer'
    | 'tidal'
    | 'amazonStore'
    | 'amazonMusic'
    | 'soundcloud'
    | 'napster'
    | 'yandex'
    | 'spinrilla';

type APIProvider =
    | 'spotify'
    | 'itunes'
    | 'youtube'
    | 'google'
    | 'pandora'
    | 'deezer'
    | 'tidal'
    | 'amazon'
    | 'soundcloud'
    | 'napster'
    | 'yandex'
    | 'spinrilla';

type entityType =
    | 'song'
    | 'album'

declare enum CountryCode {
    Afghanistan = 'AF',
    AlandIslands = 'AX',
    Albania = 'AL',
    Algeria = 'DZ',
    AmericanSamoa = 'AS',
    Andorra = 'AD',
    Angola = 'AO',
    Anguilla = 'AI',
    Antarctica = 'AQ',
    AntiguaAndBarbuda = 'AG',
    Argentina = 'AR',
    Armenia = 'AM',
    Aruba = 'AW',
    Australia = 'AU',
    Austria = 'AT',
    Azerbaijan = 'AZ',
    Bahamas = 'BS',
    Bahrain = 'BH',
    Bangladesh = 'BD',
    Barbados = 'BB',
    Belarus = 'BY',
    Belgium = 'BE',
    Belize = 'BZ',
    Benin = 'BJ',
    Bermuda = 'BM',
    Bhutan = 'BT',
    Bolivia = 'BO',
    BonaireSintEustatiusSaba = 'BQ',
    BosniaAndHerzegovina = 'BA',
    Botswana = 'BW',
    BouvetIsland = 'BV',
    Brazil = 'BR',
    BritishIndianOceanTerritory = 'IO',
    BruneiDarussalam = 'BN',
    Bulgaria = 'BG',
    BurkinaFaso = 'BF',
    Burundi = 'BI',
    Cambodia = 'KH',
    Cameroon = 'CM',
    Canada = 'CA',
    CapeVerde = 'CV',
    CaymanIslands = 'KY',
    CentralAfricanRepublic = 'CF',
    Chad = 'TD',
    Chile = 'CL',
    China = 'CN',
    ChristmasIsland = 'CX',
    CocosKeelingIslands = 'CC',
    Colombia = 'CO',
    Comoros = 'KM',
    Congo = 'CG',
    CongoDemocraticRepublic = 'CD',
    CookIslands = 'CK',
    CostaRica = 'CR',
    CoteDIvoire = 'CI',
    Croatia = 'HR',
    Cuba = 'CU',
    Curaçao = 'CW',
    Cyprus = 'CY',
    CzechRepublic = 'CZ',
    Denmark = 'DK',
    Djibouti = 'DJ',
    Dominica = 'DM',
    DominicanRepublic = 'DO',
    Ecuador = 'EC',
    Egypt = 'EG',
    ElSalvador = 'SV',
    EquatorialGuinea = 'GQ',
    Eritrea = 'ER',
    Estonia = 'EE',
    Ethiopia = 'ET',
    FalklandIslands = 'FK',
    FaroeIslands = 'FO',
    Fiji = 'FJ',
    Finland = 'FI',
    France = 'FR',
    FrenchGuiana = 'GF',
    FrenchPolynesia = 'PF',
    FrenchSouthernTerritories = 'TF',
    Gabon = 'GA',
    Gambia = 'GM',
    Georgia = 'GE',
    Germany = 'DE',
    Ghana = 'GH',
    Gibraltar = 'GI',
    Greece = 'GR',
    Greenland = 'GL',
    Grenada = 'GD',
    Guadeloupe = 'GP',
    Guam = 'GU',
    Guatemala = 'GT',
    Guernsey = 'GG',
    Guinea = 'GN',
    GuineaBissau = 'GW',
    Guyana = 'GY',
    Haiti = 'HT',
    HeardIslandMcdonaldIslands = 'HM',
    HolySeeVaticanCityState = 'VA',
    Honduras = 'HN',
    HongKong = 'HK',
    Hungary = 'HU',
    Iceland = 'IS',
    India = 'IN',
    Indonesia = 'ID',
    Iran = 'IR',
    Iraq = 'IQ',
    Ireland = 'IE',
    IsleOfMan = 'IM',
    Israel = 'IL',
    Italy = 'IT',
    Jamaica = 'JM',
    Japan = 'JP',
    Jersey = 'JE',
    Jordan = 'JO',
    Kazakhstan = 'KZ',
    Kenya = 'KE',
    Kiribati = 'KI',
    Korea = 'KR',
    KoreaDemocraticPeoplesRepublic = 'KP',
    Kuwait = 'KW',
    Kyrgyzstan = 'KG',
    LaoPeoplesDemocraticRepublic = 'LA',
    Latvia = 'LV',
    Lebanon = 'LB',
    Lesotho = 'LS',
    Liberia = 'LR',
    LibyanArabJamahiriya = 'LY',
    Liechtenstein = 'LI',
    Lithuania = 'LT',
    Luxembourg = 'LU',
    Macao = 'MO',
    Macedonia = 'MK',
    Madagascar = 'MG',
    Malawi = 'MW',
    Malaysia = 'MY',
    Maldives = 'MV',
    Mali = 'ML',
    Malta = 'MT',
    MarshallIslands = 'MH',
    Martinique = 'MQ',
    Mauritania = 'MR',
    Mauritius = 'MU',
    Mayotte = 'YT',
    Mexico = 'MX',
    Micronesia = 'FM',
    Moldova = 'MD',
    Monaco = 'MC',
    Mongolia = 'MN',
    Montenegro = 'ME',
    Montserrat = 'MS',
    Morocco = 'MA',
    Mozambique = 'MZ',
    Myanmar = 'MM',
    Namibia = 'NA',
    Nauru = 'NR',
    Nepal = 'NP',
    Netherlands = 'NL',
    NewCaledonia = 'NC',
    NewZealand = 'NZ',
    Nicaragua = 'NI',
    Niger = 'NE',
    Nigeria = 'NG',
    Niue = 'NU',
    NorfolkIsland = 'NF',
    NorthernMarianaIslands = 'MP',
    Norway = 'NO',
    Oman = 'OM',
    Pakistan = 'PK',
    Palau = 'PW',
    PalestinianTerritory = 'PS',
    Panama = 'PA',
    PapuaNewGuinea = 'PG',
    Paraguay = 'PY',
    Peru = 'PE',
    Philippines = 'PH',
    Pitcairn = 'PN',
    Poland = 'PL',
    Portugal = 'PT',
    PuertoRico = 'PR',
    Qatar = 'QA',
    Reunion = 'RE',
    Romania = 'RO',
    RussianFederation = 'RU',
    Rwanda = 'RW',
    SaintBarthelemy = 'BL',
    SaintHelena = 'SH',
    SaintKittsAndNevis = 'KN',
    SaintLucia = 'LC',
    SaintMartin = 'MF',
    SaintPierreAndMiquelon = 'PM',
    SaintVincentAndGrenadines = 'VC',
    Samoa = 'WS',
    SanMarino = 'SM',
    SaoTomeAndPrincipe = 'ST',
    SaudiArabia = 'SA',
    Senegal = 'SN',
    Serbia = 'RS',
    Seychelles = 'SC',
    SierraLeone = 'SL',
    Singapore = 'SG',
    SintMaarten = 'SX',
    Slovakia = 'SK',
    Slovenia = 'SI',
    SolomonIslands = 'SB',
    Somalia = 'SO',
    SouthAfrica = 'ZA',
    SouthGeorgiaAndSandwichIsl = 'GS',
    SouthSudan = 'SS',
    Spain = 'ES',
    SriLanka = 'LK',
    Sudan = 'SD',
    Suriname = 'SR',
    SvalbardAndJanMayen = 'SJ',
    Swaziland = 'SZ',
    Sweden = 'SE',
    Switzerland = 'CH',
    SyrianArabRepublic = 'SY',
    Taiwan = 'TW',
    Tajikistan = 'TJ',
    Tanzania = 'TZ',
    Thailand = 'TH',
    TimorLeste = 'TL',
    Togo = 'TG',
    Tokelau = 'TK',
    Tonga = 'TO',
    TrinidadAndTobago = 'TT',
    Tunisia = 'TN',
    Turkey = 'TR',
    Turkmenistan = 'TM',
    TurksAndCaicosIslands = 'TC',
    Tuvalu = 'TV',
    Uganda = 'UG',
    Ukraine = 'UA',
    UnitedArabEmirates = 'AE',
    UnitedKingdom = 'GB',
    UnitedStates = 'US',
    UnitedStatesOutlyingIslands = 'UM',
    Uruguay = 'UY',
    Uzbekistan = 'UZ',
    Vanuatu = 'VU',
    Venezuela = 'VE',
    Vietnam = 'VN',
    VirginIslandsBritish = 'VG',
    VirginIslandsUS = 'VI',
    WallisAndFutuna = 'WF',
    WesternSahara = 'EH',
    Yemen = 'YE',
    Zambia = 'ZM',
    Zimbabwe = 'ZW',
}
export = Odesli;
