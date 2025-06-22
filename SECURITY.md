# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security vulnerability in odesli.js, please follow these steps:

### 1. **DO NOT** create a public GitHub issue

Security vulnerabilities should be reported privately to avoid potential exploitation.

### 2. Email the maintainer

Send a detailed report to: `me@mtr.gg`

### 3. Include the following information:

- **Description**: A clear description of the vulnerability
- **Steps to reproduce**: Detailed steps to reproduce the issue
- **Impact**: Potential impact of the vulnerability
- **Suggested fix**: If you have suggestions for fixing the issue
- **Affected versions**: Which versions are affected
- **Proof of concept**: If applicable, include a proof of concept

### 4. Response timeline

- **Initial response**: Within 48 hours
- **Status update**: Within 1 week
- **Fix timeline**: Depends on severity and complexity

## Security Best Practices

### For Users

1. **Keep dependencies updated**: Regularly update to the latest version
2. **Use HTTPS**: Always use HTTPS when making API calls
3. **Validate inputs**: Validate all user inputs before passing to the library
4. **Rate limiting**: Respect API rate limits to avoid being blocked
5. **API key security**: Store API keys securely and never commit them to version control

### For Contributors

1. **Code review**: All code changes require security review
2. **Dependency scanning**: Run `npm audit` before submitting PRs
3. **Input validation**: Always validate and sanitize inputs
4. **Error handling**: Don't expose sensitive information in error messages
5. **Testing**: Include security-focused tests

## Security Features

### Input Validation

- URL validation and sanitization
- Parameter type checking
- Malformed response handling

### Error Handling

- Safe error messages that don't expose internal details
- Graceful handling of malformed API responses
- Rate limiting error handling

### API Security

- HTTPS-only communication
- API key validation
- Request parameter sanitization

## Dependency Security

We regularly audit our dependencies for security vulnerabilities:

```bash
# Check for vulnerabilities
npm audit

# Fix automatically fixable issues
npm audit fix

# Run security scan with Snyk
npm run security
```

## Disclosure Policy

When a security vulnerability is discovered:

1. **Private disclosure**: Issue is reported privately
2. **Investigation**: We investigate and validate the issue
3. **Fix development**: We develop and test a fix
4. **Release**: We release a patched version
5. **Public disclosure**: We publicly disclose the vulnerability with details

## Security Updates

Security updates are released as patch versions (e.g., 1.0.1, 1.0.2) and should be applied immediately.

## Contact

For security-related questions or concerns:

- Email: `me@mtr.gg`
- GitHub: [@MattrAus](https://github.com/MattrAus)

## Acknowledgments

We appreciate security researchers and users who responsibly disclose vulnerabilities. Contributors to security improvements will be acknowledged in our release notes.
