# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.2] - 2025-06-22

### Fixed

- ESLint compatibility issue with `jest/no-disabled-tests` rule and `structuredClone`
- GitHub Actions CI badge showing "no status" by updating workflow branch configuration
- GitHub Packages publishing authentication in automated workflows
- Code formatting issues causing CI failures

### Changed

- Updated Node.js test matrix to use versions 18.x, 20.x, and 22.x (removed 16.x)
- Enhanced GitHub Actions workflows for better reliability
- Improved automated publishing configuration for both npm and GitHub Packages

### Added

- Comprehensive CI job testing before commits
- Better error handling in publishing workflows
- Proper permissions configuration for package publishing

## [1.1.1] - 2025-06-22

### Added

- GitHub Packages support with scoped package name `@mattraus/odesli.js`
- Automated publishing workflows for both npm and GitHub Packages
- Installation instructions for GitHub Packages in README
- `.npmrc` configuration for GitHub Packages authentication

### Changed

- Updated package name to `@mattraus/odesli.js` for GitHub Packages
- Enhanced README with dual installation options (npm and GitHub Packages)
- Updated GitHub Actions workflows for automated publishing

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
