# Contributing to MindMeter

Thank you for your interest in contributing to MindMeter! This document provides guidelines and information for contributors.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)
- [Feature Requests](#feature-requests)
- [Testing](#testing)
- [Documentation](#documentation)

## Getting Started

Before contributing, please:

1. **Read the README.md** - Understand the project structure and setup
2. **Check existing issues** - Avoid duplicating work
3. **Join discussions** - Participate in existing conversations
4. **Set up your environment** - Follow the development setup guide

## Development Setup

### Prerequisites

- Java 17 (JDK 17)
- Node.js 18+ and npm
- MySQL 8.0+
- Maven 3.6+
- Git

### Local Development

1. **Fork the repository**

   ```bash
   git clone https://github.com/TranKienCuong2003/MindMeter.git
   cd MindMeter
   ```

2. **Set up the database**

   ```bash
   mysql -u root -p < database/MindMeter.sql
   ```

3. **Configure backend**

   - Copy `backend/src/main/resources/application.properties.example` to `application.properties`
   - Update database credentials and API keys

4. **Start backend**

   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```

5. **Start frontend**
   ```bash
   cd frontend
   npm install
   npm start
   ```

## Coding Standards

### Backend (Java/Spring Boot)

- **Java Version**: Use Java 17 features
- **Naming**: Follow Java naming conventions
- **Documentation**: Add Javadoc for public methods
- **Testing**: Write unit tests for new features
- **Dependencies**: Use Spring Boot starters when possible

```java
// Example of good Java code
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    /**
     * Creates a new user account
     * @param userRequest the user creation request
     * @return the created user
     */
    public User createUser(CreateUserRequest userRequest) {
        // Implementation
    }
}
```

### Frontend (React/JavaScript)

- **React Hooks**: Use functional components with hooks
- **State Management**: Use React Context or local state
- **Styling**: Use Tailwind CSS classes
- **Components**: Create reusable components
- **Error Handling**: Implement proper error boundaries

```jsx
// Example of good React component
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

const UserProfile = ({ userId }) => {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser(userId);
  }, [userId]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
      {/* Component content */}
    </div>
  );
};
```

### Database

- **Migrations**: Use proper database migrations
- **Naming**: Use snake_case for table and column names
- **Indexes**: Add indexes for frequently queried columns
- **Relationships**: Define proper foreign key constraints

## Commit Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **chore**: Changes to the build process or auxiliary tools

### Examples

```
feat(auth): add Google OAuth2 login support
fix(chatbot): resolve typewriter animation replay issue
docs(readme): update installation instructions
style(ui): improve button styling consistency
refactor(api): restructure depression test endpoints
```

## Pull Request Process

1. **Create a feature branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**

   - Follow coding standards
   - Add tests for new features
   - Update documentation if needed

3. **Test your changes**

   ```bash
   # Backend tests
   cd backend && ./mvnw test

   # Frontend tests
   cd frontend && npm test
   ```

4. **Commit your changes**

   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

5. **Push to your fork**

   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Use the PR template
   - Describe your changes clearly
   - Link related issues
   - Request reviews from maintainers

### PR Template

```markdown
## Description

Brief description of the changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No console errors
```

## Issue Reporting

When reporting issues, please include:

1. **Environment details**

   - Operating system
   - Browser version (if applicable)
   - Node.js version
   - Java version

2. **Steps to reproduce**

   - Clear, step-by-step instructions
   - Expected vs actual behavior

3. **Additional context**
   - Screenshots or videos
   - Console logs
   - Network requests

### Issue Template

```markdown
## Bug Description

Brief description of the issue

## Steps to Reproduce

1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior

What you expected to happen

## Actual Behavior

What actually happened

## Environment

- OS: [e.g. Windows 10, macOS 12.0]
- Browser: [e.g. Chrome 96, Firefox 95]
- Node.js: [e.g. 18.0.0]
- Java: [e.g. 17.0.1]

## Additional Context

Any other context about the problem
```

## Feature Requests

When requesting features:

1. **Describe the problem** - Why is this feature needed?
2. **Propose a solution** - How should it work?
3. **Consider alternatives** - Are there other ways to solve this?
4. **Provide examples** - Show how it might be used

## Testing

### Backend Testing

```bash
# Run all tests
./mvnw test

# Run specific test class
./mvnw test -Dtest=UserServiceTest

# Run with coverage
./mvnw jacoco:report
```

### Frontend Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Integration Testing

- Test API endpoints with Postman or similar tools
- Verify database operations
- Test authentication flows
- Check error handling

## Documentation

### Code Documentation

- **Java**: Use Javadoc for public methods
- **React**: Use JSDoc for component props
- **API**: Document endpoints with OpenAPI/Swagger
- **Database**: Document schema changes

### User Documentation

- Update README.md for new features
- Add screenshots for UI changes
- Update API documentation
- Maintain changelog

## Getting Help

- **GitHub Issues**: For bugs and feature requests
- **Discussions**: For questions and general discussion
- **Email**: trankiencuong30072003@gmail.com for private matters

## Recognition

Contributors will be recognized in:

- **README.md** - List of contributors
- **Release notes** - Credit for significant contributions
- **GitHub contributors** - Automatic recognition

Thank you for contributing to MindMeter! 🧠✨
