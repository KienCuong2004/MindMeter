import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

// Custom metrics
const errorRate = new Rate("errors");

// Test configuration
export const options = {
  stages: [
    { duration: "30s", target: 20 }, // Ramp up to 20 users
    { duration: "1m", target: 20 }, // Stay at 20 users
    { duration: "30s", target: 50 }, // Ramp up to 50 users
    { duration: "1m", target: 50 }, // Stay at 50 users
    { duration: "30s", target: 0 }, // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% of requests should be below 500ms
    http_req_failed: ["rate<0.01"], // Error rate should be less than 1%
    errors: ["rate<0.01"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";

export default function () {
  // Test homepage
  let res = http.get(`${BASE_URL}/api/blog/posts/public?page=0&size=10`);
  let success = check(res, {
    "status is 200": (r) => r.status === 200,
    "response time < 500ms": (r) => r.timings.duration < 500,
  });
  errorRate.add(!success);
  sleep(1);

  // Test authentication endpoint (if available)
  res = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({
      email: "test@example.com",
      password: "password123",
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
  success = check(res, {
    "login status is 200 or 401": (r) => r.status === 200 || r.status === 401,
  });
  errorRate.add(!success);
  sleep(1);

  // Test blog posts endpoint
  res = http.get(`${BASE_URL}/api/blog/posts/public?page=0&size=20`);
  success = check(res, {
    "status is 200": (r) => r.status === 200,
    "response has data": (r) => r.body.length > 0,
  });
  errorRate.add(!success);
  sleep(1);
}

export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: " ", enableColors: true }),
    "summary.json": JSON.stringify(data),
  };
}
