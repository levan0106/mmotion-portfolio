# Contributing to Portfolio Management System

Thank you for your interest in contributing to the Portfolio Management System! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Guidelines](#contributing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Code Style](#code-style)
- [Documentation](#documentation)
- [Issue Reporting](#issue-reporting)

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Create a new branch for your feature or bugfix
4. Make your changes
5. Add tests for your changes
6. Ensure all tests pass
7. Submit a pull request

## Development Setup

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- PostgreSQL 15+
- Redis 7+

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/portfolio-management-system.git
   cd portfolio-management-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd frontend && npm install
   ```

3. **Start the development environment**
   ```bash
   docker-compose up -d
   ```

4. **Run database migrations**
   ```bash
   npm run migration:run
   ```

5. **Start the development servers**
   ```bash
   # Backend (Terminal 1)
   npm run start:dev
   
   # Frontend (Terminal 2)
   cd frontend && npm run dev
   ```

## Contributing Guidelines

### Branch Naming

Use descriptive branch names that indicate the type of change:

- `feature/portfolio-analytics` - New features
- `bugfix/fix-portfolio-calculation` - Bug fixes
- `hotfix/critical-security-fix` - Critical fixes
- `refactor/optimize-database-queries` - Code refactoring
- `docs/update-api-documentation` - Documentation updates

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
type(scope): description

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

**Examples:**
```
feat(portfolio): add portfolio analytics dashboard
fix(api): resolve portfolio calculation error
docs(api): update portfolio API documentation
test(portfolio): add unit tests for portfolio service
```

## Pull Request Process

1. **Create a Pull Request**
   - Use a descriptive title
   - Provide a detailed description of changes
   - Reference any related issues

2. **Ensure Quality**
   - All tests must pass
   - Code coverage should not decrease
   - Code follows the established style guide
   - Documentation is updated if needed

3. **Review Process**
   - At least one reviewer must approve
   - All CI/CD checks must pass
   - Address any feedback from reviewers

4. **Merge**
   - Use "Squash and merge" for feature branches
   - Use "Merge commit" for release branches

## Testing

### Running Tests

```bash
# Backend tests
npm run test
npm run test:cov

# Frontend tests
cd frontend
npm run test
npm run test:coverage

# Integration tests
npm run test:e2e
```

### Writing Tests

- Write unit tests for all new functionality
- Maintain or improve test coverage
- Use descriptive test names
- Follow the AAA pattern (Arrange, Act, Assert)

**Example:**
```typescript
describe('PortfolioService', () => {
  it('should create a new portfolio with valid data', async () => {
    // Arrange
    const createPortfolioDto = {
      name: 'Test Portfolio',
      baseCurrency: 'USD',
      accountId: 'test-account-id'
    };

    // Act
    const result = await portfolioService.create(createPortfolioDto);

    // Assert
    expect(result).toBeDefined();
    expect(result.name).toBe(createPortfolioDto.name);
  });
});
```

## Code Style

### Backend (TypeScript/Node.js)

- Use TypeScript strict mode
- Follow ESLint configuration
- Use Prettier for code formatting
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

### Frontend (React/TypeScript)

- Use functional components with hooks
- Follow Material-UI design patterns
- Use TypeScript for type safety
- Follow React best practices
- Use meaningful component names

### Database

- Use descriptive table and column names
- Add proper indexes for performance
- Use migrations for schema changes
- Follow naming conventions

## Documentation

### API Documentation

- Update Swagger documentation for API changes
- Provide examples for new endpoints
- Document error responses
- Include request/response schemas

### Code Documentation

- Add JSDoc comments for functions and classes
- Document complex business logic
- Update README files when needed
- Keep CHANGELOG.md updated

## Issue Reporting

### Bug Reports

When reporting bugs, please include:

1. **Description**: Clear description of the bug
2. **Steps to Reproduce**: Detailed steps to reproduce the issue
3. **Expected Behavior**: What you expected to happen
4. **Actual Behavior**: What actually happened
5. **Environment**: OS, browser, Node.js version, etc.
6. **Screenshots**: If applicable
7. **Logs**: Any relevant error logs

### Feature Requests

When requesting features, please include:

1. **Description**: Clear description of the feature
2. **Use Case**: Why this feature would be useful
3. **Proposed Solution**: How you think it should work
4. **Alternatives**: Any alternative solutions considered
5. **Additional Context**: Any other relevant information

## Development Workflow

### Daily Development

1. Pull latest changes from main branch
2. Create feature branch
3. Make changes with frequent commits
4. Run tests locally
5. Push branch and create PR
6. Address review feedback
7. Merge when approved

### Release Process

1. Update version in package.json
2. Update CHANGELOG.md
3. Create release branch
4. Run full test suite
5. Create release tag
6. Deploy to staging
7. Deploy to production

## Getting Help

- **Documentation**: Check the project documentation
- **Issues**: Search existing issues or create a new one
- **Discussions**: Use GitHub Discussions for questions
- **Code Review**: Ask for help in pull requests

## Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Release notes
- Project documentation

Thank you for contributing to the Portfolio Management System! 🚀
