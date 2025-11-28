# Performance Testing

This directory contains performance testing scripts for MindMeter.

## Tools

- **k6**: Load testing tool (recommended)
- **Artillery**: Alternative load testing tool

## Prerequisites

### k6

Install k6:

- Windows: `choco install k6` or download from https://k6.io/docs/getting-started/installation/
- Mac: `brew install k6`
- Linux: See https://k6.io/docs/getting-started/installation/

### Artillery

Install Artillery:

```bash
npm install -g artillery
```

## Running Tests

### k6 Load Test

```bash
# Basic test
k6 run k6-load-test.js

# With custom base URL
k6 run --env BASE_URL=http://localhost:8080 k6-load-test.js

# With more virtual users
k6 run --vus 100 --duration 60s k6-load-test.js
```

### Artillery Load Test

```bash
# Run load test
artillery run artillery-load-test.yml

# Run with output file
artillery run --output report.json artillery-load-test.yml

# Generate HTML report
artillery report report.json
```

## Test Scenarios

1. **Public API Load Test**: Tests public blog posts endpoint
2. **Authentication Flow**: Tests login endpoint
3. **Blog Posts Pagination**: Tests pagination with random pages
4. **Mixed Workload**: Simulates realistic user behavior

## Performance Targets

- **Response Time**: 95% of requests should complete in under 500ms
- **Error Rate**: Less than 1% of requests should fail
- **Throughput**: Should handle at least 50 concurrent users

## Monitoring

Monitor these metrics during tests:

- Response time (p50, p95, p99)
- Error rate
- Request rate (RPS)
- CPU and memory usage on server

## CI/CD Integration

Add performance tests to your CI/CD pipeline:

```yaml
- name: Run Performance Tests
  run: |
    k6 run performance/k6-load-test.js
```
