# Release v1.1.0 - Major Improvements & Professional Setup

## 🎉 What's New

This release brings significant improvements to the odesli.js package, transforming it from a basic client into a production-ready, professionally maintained library.

## ✨ Key Features Added

### 🧪 **Comprehensive Testing**

- **40 comprehensive tests** with 100% coverage
- Jest test suite with mocking for reliable testing
- Edge case handling and error scenario testing
- Automated test runs in CI/CD pipeline

### 🛠️ **Development Tools**

- **ESLint** configuration for code quality
- **Prettier** for consistent code formatting
- **TypeScript 5.0** with enhanced type definitions
- **Security scanning** with Snyk integration

### 🚀 **CI/CD Pipeline**

- **GitHub Actions** workflows for automated testing
- **Automated publishing** on release tags
- **Code quality checks** (linting, formatting, security)
- **Multi-platform testing** support

### 📚 **Documentation & Examples**

- **Professional README** with badges and comprehensive guides
- **Example scripts** for basic and advanced usage
- **TypeScript support** documentation
- **Error handling** examples and best practices

### 🔧 **Code Improvements**

- **Enhanced error handling** with descriptive messages
- **Simplified async logic** for better performance
- **Modern ES modules** support
- **Better TypeScript** type definitions
- **Professional project structure**

## 🐛 Bug Fixes

- Fixed API parameter mismatch (`api` → `apiKey`)
- Removed unnecessary Promise.all wrappers
- Improved error handling in request methods
- Enhanced TypeScript compatibility

## 📦 Installation

```bash
npm install odesli.js@1.1.0
```

## 🚀 Quick Start

```js
const Odesli = require('odesli.js');

const odesli = new Odesli();
const song = await odesli.fetch(
  'https://open.spotify.com/track/4Km5HrUvYTaSUfiSGPJeQR'
);
console.log(`${song.title} by ${song.artist[0]}`);
```

## 🔗 Links

- **NPM Package**: [npmjs.com/package/odesli.js](https://www.npmjs.com/package/odesli.js)
- **GitHub Repository**: [github.com/MattrAus/odesli.js](https://github.com/MattrAus/odesli.js)
- **Documentation**: [github.com/MattrAus/odesli.js#readme](https://github.com/MattrAus/odesli.js#readme)

## 🙏 Thanks

Thank you to all contributors and users who provided feedback and suggestions for this release!

---

**Breaking Changes**: None - This is a backward-compatible release.

**Migration**: No migration required. Simply update to version 1.1.0 for all improvements.
