# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-06-22

### Added

- Comprehensive test suite with Jest (40 tests, 100% coverage)
- ESLint configuration for code quality
- Prettier configuration for code formatting
- GitHub Actions CI/CD workflows
- Example code in `examples/` directory
- Improved TypeScript configuration
- Better error handling and validation
- Professional documentation with badges
- Security scanning with Snyk
- Development tools and scripts

### Fixed

- API parameter mismatch (`api` → `apiKey`)
- Simplified async logic in all methods
- Removed unnecessary Promise.all wrappers
- Improved error handling in `_request` method
- Enhanced TypeScript type definitions

### Changed

- Updated package.json with better metadata and exports
- Enhanced README with comprehensive documentation
- Added proper TypeScript declarations
- Improved code structure and maintainability
- Modern ES modules support
- Professional project structure

## [1.0.3] - 2024-01-XX

### Features

- Initial release
- Basic Odesli API client functionality
- Support for fetch, getByParams, and getById methods
- TypeScript definitions
- Basic documentation
- Fetch songs by URL from any streaming platform
- Get song information by platform, type, and ID
- Get song information by entity ID
- Support for multiple countries
- Optional API key support for higher rate limits
