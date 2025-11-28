# Testing Guide for MindMeter

This document provides a comprehensive guide to testing in the MindMeter project.

## Overview

MindMeter uses a multi-layered testing approach:

1. **Unit Tests**: Test individual components and functions
2. **Integration Tests**: Test API endpoints and service interactions
3. **E2E Tests**: Test complete user flows with Playwright
4. **Performance Tests**: Load and stress testing with k6/Artillery

## Frontend Testing

### Unit Tests

Frontend unit tests use Jest and React Testing Library.

**Run tests:**
```bash
cd frontend
npm test
```

**Run with coverage:**
```bash
npm run test:coverage
```

**Test files location:**
- `frontend/src/components/__tests__/` - Component tests
- `frontend/src/pages/__tests__/` - Page tests (to be created)

**Example test:**
```javascript
import { render, screen } from '@testing-library/react';
import LoginForm from '../LoginForm';

test('renders login form', () => {
  render(<LoginForm />);
  expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
});
```

### E2E Tests

E2E tests use Playwright to test complete user flows.

**Run E2E tests:**
```bash
cd frontend
npm run test:e2e
```

**Run with UI:**
```bash
npm run test:e2e:ui
```

**Debug tests:**
```bash
npm run test:e2e:debug
```

**View test report:**
```bash
npm run test:e2e:report
```

**Test files location:**
- `frontend/e2e/` - E2E test scenarios

**Test scenarios:**
- `auth.spec.js` - Authentication flows
- `dashboard.spec.js` - Dashboard functionality
- `blog.spec.js` - Blog features
- `performance.spec.js` - Performance benchmarks

## Backend Testing

### Unit Tests

Backend unit tests use JUnit 5 and Mockito.

**Run tests:**
```bash
cd backend
mvn test
```

**Run with coverage:**
```bash
mvn test jacoco:report
```

**View coverage report:**
- Open `backend/target/site/jacoco/index.html`

**Test files location:**
- `backend/src/test/java/com/shop/backend/service/` - Service tests
- `backend/src/test/java/com/shop/backend/controller/` - Controller tests

### Integration Tests

Integration tests use Spring Boot Test with MockMvc.

**Run integration tests:**
```bash
cd backend
mvn test -Dtest=*IntegrationTest
```

**Test files:**
- `AuthIntegrationTest.java` - Authentication API tests
- `BlogIntegrationTest.java` - Blog API tests
- `AppointmentIntegrationTest.java` - Appointment API tests

**Example integration test:**
```java
@SpringBootTest
@AutoConfigureMockMvc
class BlogIntegrationTest {
    @Test
    void getPublicPosts_ShouldReturnOk() throws Exception {
        mockMvc.perform(get("/api/blog/posts/public"))
            .andExpect(status().isOk());
    }
}
```

## Performance Testing

### k6 Load Testing

**Install k6:**
- Windows: `choco install k6`
- Mac: `brew install k6`
- Linux: See https://k6.io/docs/getting-started/installation/

**Run load test:**
```bash
cd performance
k6 run k6-load-test.js
```

**Custom configuration:**
```bash
k6 run --vus 100 --duration 60s k6-load-test.js
```

### Artillery Load Testing

**Install Artillery:**
```bash
npm install -g artillery
```

**Run load test:**
```bash
cd performance
artillery run artillery-load-test.yml
```

**Generate report:**
```bash
artillery run --output report.json artillery-load-test.yml
artillery report report.json
```

## Test Coverage Goals

- **Frontend**: > 70% coverage
- **Backend**: > 80% coverage
- **Critical paths**: 100% coverage

## Writing Tests

### Frontend Component Test

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  test('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  test('handles user interaction', () => {
    render(<MyComponent />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByText('Clicked')).toBeInTheDocument();
  });
});
```

### Backend Service Test

```java
@ExtendWith(MockitoExtension.class)
class MyServiceTest {
    @Mock
    private MyRepository repository;
    
    @InjectMocks
    private MyService service;
    
    @Test
    void shouldReturnData() {
        when(repository.findAll()).thenReturn(List.of(new MyEntity()));
        List<MyEntity> result = service.getAll();
        assertEquals(1, result.size());
    }
}
```

### E2E Test

```javascript
test('user can login', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button:has-text("Login")');
  await expect(page).toHaveURL(/dashboard/);
});
```

## CI/CD Integration

Tests run automatically in CI/CD pipeline:

1. **Unit tests** run on every commit
2. **Integration tests** run on pull requests
3. **E2E tests** run on merge to main
4. **Performance tests** run nightly

## Best Practices

1. **Write tests first** (TDD) for critical features
2. **Keep tests independent** - each test should be able to run alone
3. **Use descriptive test names** - describe what is being tested
4. **Mock external dependencies** - don't rely on external services
5. **Test edge cases** - empty inputs, null values, error conditions
6. **Keep tests fast** - unit tests should run in milliseconds
7. **Maintain test data** - use fixtures and factories for test data

## Troubleshooting

### Frontend tests failing

- Check if `setupTests.js` is properly configured
- Verify all mocks are set up correctly
- Check for async operations that need `waitFor`

### Backend tests failing

- Ensure test database is configured
- Check if `@Transactional` is used correctly
- Verify mock setup with `@Mock` and `@InjectMocks`

### E2E tests timing out

- Increase timeout in `playwright.config.js`
- Check if application is running
- Verify selectors are correct

### Performance tests failing

- Check server resources (CPU, memory)
- Verify database connection pool settings
- Review slow queries in database logs

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [JUnit 5 Documentation](https://junit.org/junit5/docs/current/user-guide/)
- [k6 Documentation](https://k6.io/docs/)
- [Artillery Documentation](https://www.artillery.io/docs)

