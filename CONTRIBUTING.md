# Contributing to odesli.js

Thank you for your interest in contributing to odesli.js! This document provides guidelines and information for contributors.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

- Use the GitHub issue tracker
- Include a clear and descriptive title
- Provide steps to reproduce the issue
- Include error messages and stack traces
- Specify your environment (Node.js version, OS, etc.)

### Suggesting Enhancements

- Use the GitHub issue tracker
- Describe the enhancement clearly
- Explain why this enhancement would be useful
- Include examples if applicable

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run the tests (`npm test`)
5. Run the linter (`npm run lint`)
6. Run the formatter (`npm run format`)
7. Commit your changes (`git commit -m 'Add some amazing feature'`)
8. Push to the branch (`git push origin feature/amazing-feature`)
9. Open a Pull Request

## Development Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/MattrAus/odesli.js.git
   cd odesli.js
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Run tests:

   ```bash
   npm test
   ```

4. Run linting:

   ```bash
   npm run lint
   ```

5. Format code:
   ```bash
   npm run format
   ```

## Code Style

- Follow the existing code style
- Use ESLint and Prettier configurations
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## Testing

- Write tests for new features
- Ensure all tests pass before submitting PR
- Use descriptive test names
- Mock external dependencies

## Documentation

- Update README.md if adding new features
- Add JSDoc comments for new functions
- Update TypeScript definitions if needed
- Add examples for new functionality

## Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create a GitHub release
4. The CI/CD pipeline will automatically publish to npm

## Questions?

If you have questions about contributing, please open an issue or contact the maintainers.

Thank you for contributing to odesli.js! 🎵
