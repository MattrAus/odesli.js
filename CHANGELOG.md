<!-- markdownlint-disable MD024 -->

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.7] - 2025-01-27

### Fixed

- **Enhanced TypeScript Definitions**: Improved type definitions for better IntelliSense and type safety
- **Batch Operations Support**: Added proper types for batch URL fetching with error handling
- **Entity Data Completeness**: Added missing properties to EntityData interface (thumbnailWidth, thumbnailHeight, apiProvider, platforms)
- **Platform Link Enhancement**: Added entityUniqueId property to PlatformLink interface
- **Configuration Options**: Added metrics configuration option to OdesliOptions interface

### Added

- **BatchError Interface**: Proper error typing for batch operations with specific error categories
- **BatchResult Type**: Type-safe return type for batch fetch operations
- **Enhanced Error Types**: Added specific error types (BAD_REQUEST, UNAUTHORIZED, RATE_LIMITED, etc.)

## [1.3.6] - 2025-07-12

### Changed

- Version bump for dependency updates and workflow improvements

## [1.3.5] - 2025-07-12

### Added

- **Automated Workflows**: Enhanced Dependabot auto-merge workflow with version bumping and tagging
- **Dependency Updates**: Updated development dependencies for security and compatibility

### Changed

- Improved CI/CD pipeline automation
- Enhanced dependency management workflows

## [1.3.4] - 2025-06-23

### Changed

- **Code Refactoring**: Removed redundant `fetchBatch` method to improve code maintainability
- **Documentation Updates**: Updated README badges and documentation links

### Fixed

- **Build System**: Fixed build configuration for better cross-platform compatibility
- **Dependencies**: Updated development dependencies for improved security

## [1.3.3] - 2025-06-23

### Changed

- Version bump for registry publishing and workflow improvements

## [1.3.2] - 2025-06-23

### Fixed

- **Security Vulnerabilities**: Fixed security vulnerabilities in dependencies
- **Test Dependencies**: Added missing `jest-fetch-mock` dependency for proper testing
- **User-Agent Validation**: Relaxed user-agent check in tests for better compatibility
- **Publishing Workflows**: Streamlined publishing workflows for both npm and GitHub Packages

### Changed

- Updated package-lock.json and package.json for security improvements
- Enhanced build and deployment processes

## [1.3.1] - 2025-06-23

### Changed

- Version bump for GitHub Packages release and registry configuration

## [1.3.0] - 2025-06-23

### Fixed

- Fixed a critical bug where an un-referenced `setInterval` in the `MetricsCollector` would cause Node.js processes to hang and not exit gracefully.

### Added

- The `Odesli` constructor now accepts `{ metrics: false }` as an option to completely disable the metrics collection feature.

### Changed

- **Code Formatting**: Applied Prettier formatting for consistent code style
- **Linting**: Resolved linting and formatting errors for better code quality
- **Metrics Stability**: Improved metrics collector stability and performance

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
- **ESLint Compatibility**: Resolved ESLint structuredClone compatibility issue
- **Formatting Issues**: Fixed formatting issues causing CI failure
- **Workflow Configuration**: Updated workflows to use master branch for CI badge

### Added

- **GitHub Packages Support**: Added automated GitHub Packages publishing workflows
- **Enhanced Documentation**: Updated documentation and policy files
- **CI/CD Improvements**: Added comprehensive CI/CD pipeline with automated testing and publishing

### Changed

- **Dependencies**: Updated and reverted dependencies for better compatibility
- **Line Endings**: Added .gitattributes for consistent line endings across platforms
- **Linting**: Fixed lint and formatting issues for CI compliance

## [1.1.1] - 2024-12-18

### Fixed

- Fixed linter errors caused by Windows line endings
- Improved code formatting and consistency
- **GitHub Packages Workflow**: Enhanced GitHub Packages workflow with debugging and GITHUB_TOKEN usage
- **Package Configuration**: Fixed package names configuration for different registries
- **Permissions**: Added proper permissions to npm publish job

### Added

- **Manual Trigger Support**: Added manual trigger support to publish workflows
- **Dedicated Tokens**: Implemented dedicated GH_PACKAGES_TOKEN for GitHub Packages publishing

### Changed

- **Workflow Splitting**: Split deployment workflows for npm and GitHub Packages
- **Documentation Links**: Updated API documentation links to correct Odesli API docs

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
