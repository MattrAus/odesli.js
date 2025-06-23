<!-- markdownlint-disable MD024 -->
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2025-06-23

### Fixed

- Fixed a critical bug where an un-referenced `setInterval` in the `MetricsCollector` would cause Node.js processes to hang and not exit gracefully.

### Added

- The `Odesli` constructor now accepts `{ metrics: false }` as an option to completely disable the metrics collection feature.

> **Note**: For a comprehensive overview of all recent API enhancements and features, please see the [API Improvements](./API_IMPROVEMENTS.md) documentation.

## [1.2.0] - 2025-06-22

### Added

- **Country Code Validation**: Added strict TypeScript validation for country codes using ISO 3166-1 alpha-2 standard
- **getCountryOptions() Method**: New static method that returns all valid country codes with full country names for UI dropdowns
- **Enhanced TypeScript Support**: Added `CountryCode` union type for strict country code validation
- **Improved Examples**: Updated all examples to demonstrate new country code features and comprehensive usage
- **Comprehensive Testing**: Added extensive tests for country code validation and getCountryOptions method
- **Better Documentation**: Updated README with TypeScript examples and country code usage patterns

### Features

- TypeScript autocomplete now shows only valid country codes
- Full country names available for UI dropdowns via `getCountryOptions()`
- 249 supported countries with ISO 3166-1 alpha-2 codes
- Enhanced error handling for invalid country codes
- Improved batch fetching with country-specific options

### Technical Improvements

- Added comprehensive test coverage for new country code features
- Updated TypeScript definitions with strict country code validation
- Enhanced examples demonstrating all new features
- Improved documentation with practical usage examples

## [1.1.2] - 2024-12-18

### Fixed

- Fixed User-Agent format to match expected pattern
- Improved error handling and propagation
- Fixed test failures related to response handling

## [1.1.1] - 2024-12-18

### Fixed

- Fixed linter errors caused by Windows line endings
- Improved code formatting and consistency

## [1.1.0] - 2024-12-18

### Added

- **Unified Fetch API**: Single `fetch()` method that handles both single URLs and arrays of URLs
- **Enhanced Parameter Handling**: Better validation and processing of request parameters
- **Retry Logic**: Configurable retry mechanism with exponential backoff
- **Custom Headers**: Support for custom request headers including User-Agent customization
- **Base URL Customization**: Ability to override the default API base URL
- **Parameter Validation Toggle**: Option to enable/disable parameter validation
- **Logging Support**: Built-in logging with customizable log levels
- **Utility Methods**: Added `detectPlatform()`, `extractId()`, and `getSupportedPlatforms()`
- **Cache Statistics**: Enhanced cache with detailed statistics and hit rate tracking
- **Rate Limiter**: Advanced rate limiting with multiple strategies (token-bucket, leaky-bucket, sliding-window)
- **Metrics Collector**: Comprehensive metrics collection for monitoring and analytics
- **Plugin System**: Extensible plugin architecture with hooks, middleware, and transformers
- **Batch Processing**: Efficient batch fetching with concurrency control and error handling

### Changed

- **Breaking Change**: Replaced individual methods with unified `fetch()` API
- **Enhanced Error Handling**: More detailed error messages and better error propagation
- **Improved TypeScript Support**: Better type definitions and stricter validation
- **Better Documentation**: Comprehensive examples and API documentation

### Technical Improvements

- Added comprehensive test suite with 100% coverage
- Enhanced error handling and validation
- Improved performance with optimized batch processing
- Better memory management and resource cleanup
- Enhanced logging and debugging capabilities

## [1.0.0] - 2024-12-17

### Added

- Initial release of odesli.js
- Basic API client for Odesli.co (formerly song.link/album.link)
- Support for fetching song and album links across multiple platforms
- TypeScript definitions
- Basic caching mechanism
- Error handling and validation
- Support for API keys and rate limiting
- Documentation and examples

### Features

- Cross-platform music link fetching
- Support for Spotify, Apple Music, YouTube Music, and more
- Multi-country support
- Optional API key for higher rate limits
- Lightweight and fast performance
- Comprehensive error handling
