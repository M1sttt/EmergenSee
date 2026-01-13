# Contributing to EmergenSee

Thank you for your interest in contributing to EmergenSee! This document provides guidelines and instructions for contributing.

## Code of Conduct

We are committed to providing a welcoming and inclusive experience for everyone. We expect all contributors to:

- Be respectful and considerate
- Welcome newcomers and help them get started
- Be open to constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

## How to Contribute

### Reporting Bugs

Before creating a bug report, please check the existing issues to avoid duplicates. When creating a bug report, include:

- A clear and descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Environment details (OS, Node version, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- A clear and descriptive title
- A detailed description of the proposed feature
- Explain why this enhancement would be useful
- List any alternatives you've considered

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** following our coding standards
3. **Test your changes** thoroughly
4. **Update documentation** if needed
5. **Ensure tests pass** and linting succeeds
6. **Create a pull request** with a clear description

#### Pull Request Guidelines

- Use a clear and descriptive title
- Reference any related issues
- Describe your changes in detail
- Include screenshots for UI changes
- Keep pull requests focused on a single concern
- Write meaningful commit messages

## Development Setup

See [DEVELOPMENT.md](docs/DEVELOPMENT.md) for detailed setup instructions.

Quick start:
```bash
# Clone and install
git clone <repo-url>
cd EmergenSee
pnpm install

# Set up environment variables
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Start development
pnpm dev
```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Avoid using `any` type
- Provide proper type annotations
- Use interfaces for object shapes

### Code Style

- Follow ESLint rules
- Use Prettier for formatting
- Use meaningful variable names
- Keep functions small and focused
- Write self-documenting code
- Add comments for complex logic

### Git Commit Messages

Follow the conventional commits specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Example:
```
feat(events): add event filtering by priority

Add ability to filter events by priority level in the events list.
This improves user experience by allowing focus on critical events.

Closes #123
```

## Testing

### Writing Tests

- Write unit tests for business logic
- Write integration tests for API endpoints
- Write E2E tests for critical user flows
- Aim for good test coverage
- Keep tests simple and focused

### Running Tests

```bash
# API tests
cd apps/api
pnpm test
pnpm test:e2e

# Web tests
cd apps/web
pnpm test
```

## Documentation

- Update README.md for user-facing changes
- Update docs/ for architectural changes
- Add JSDoc comments for public APIs
- Update API.md for endpoint changes
- Include examples in documentation

## Project Structure

```
EmergenSee/
├── apps/
│   ├── api/          # Backend application
│   └── web/          # Frontend application
├── packages/
│   ├── shared/       # Shared types and schemas
│   ├── ui/           # Shared UI components
│   ├── eslint-config/
│   └── tsconfig/
└── docs/             # Documentation
```

## Review Process

1. **Automated checks** must pass (linting, tests, build)
2. **Code review** by at least one maintainer
3. **Discussion** of any concerns or suggestions
4. **Approval** and merge by maintainer

## Areas for Contribution

We especially welcome contributions in these areas:

### High Priority
- Bug fixes
- Performance improvements
- Accessibility improvements
- Test coverage
- Documentation improvements

### Features
- Mobile responsive design
- Advanced filtering and search
- Analytics dashboard
- Export functionality
- Notification system
- Offline support

### Infrastructure
- CI/CD pipeline
- Docker improvements
- Kubernetes configuration
- Monitoring and logging
- Performance optimization

## Questions?

If you have questions about contributing, feel free to:

- Open a GitHub issue with the "question" label
- Reach out to maintainers
- Check existing documentation

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project documentation

Thank you for contributing to EmergenSee!
