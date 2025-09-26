import React, { useState } from "react";
import IpFilteringDashboard from "../components/IpFilteringDashboard";

const TestIpFilteringPage = () => {
  const [testResults, setTestResults] = useState([]);

  const runTests = async () => {
    const tests = [
      {
        name: "Test Valid IP",
        ip: "192.168.1.1",
        expected: "allowed",
      },
      {
        name: "Test Suspicious IP",
        ip: "127.0.0.1",
        expected: "blocked",
      },
      {
        name: "Test Invalid IP",
        ip: "invalid-ip",
        expected: "blocked",
      },
      {
        name: "Test Null IP",
        ip: "",
        expected: "blocked",
      },
    ];

    const results = [];

    for (const test of tests) {
      try {
        const response = await fetch(
          "/api/admin/security/ip-filtering/test-ip",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ip: test.ip }),
          }
        );

        if (response.ok) {
          const result = await response.json();
          results.push({
            ...test,
            actual: result.isBlocked ? "blocked" : "allowed",
            passed:
              (result.isBlocked && test.expected === "blocked") ||
              (!result.isBlocked && test.expected === "allowed"),
            response: result,
          });
        } else {
          results.push({
            ...test,
            actual: "error",
            passed: false,
            error: `HTTP ${response.status}`,
          });
        }
      } catch (error) {
        results.push({
          ...test,
          actual: "error",
          passed: false,
          error: error.message,
        });
      }
    }

    setTestResults(results);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Test Controls */}
      <div className="bg-white p-6 shadow-md">
        <h1 className="text-2xl font-bold mb-4">IP Filtering Test Suite</h1>
        <button
          onClick={runTests}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Run Tests
        </button>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="bg-white p-6 shadow-md mt-4">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <div className="space-y-4">
            {testResults.map((test, index) => (
              <div
                key={index}
                className={`p-4 rounded-md border-l-4 ${
                  test.passed
                    ? "bg-green-50 border-green-500"
                    : "bg-red-50 border-red-500"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{test.name}</h3>
                    <p className="text-sm text-gray-600">
                      IP:{" "}
                      <code className="bg-gray-100 px-2 py-1 rounded">
                        {test.ip || "null"}
                      </code>
                    </p>
                    <p className="text-sm text-gray-600">
                      Expected: {test.expected} | Actual: {test.actual}
                    </p>
                    {test.error && (
                      <p className="text-sm text-red-600">
                        Error: {test.error}
                      </p>
                    )}
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      test.passed
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {test.passed ? "PASS" : "FAIL"}
                  </div>
                </div>
                {test.response && (
                  <div className="mt-2 text-sm">
                    <pre className="bg-gray-100 p-2 rounded overflow-x-auto">
                      {JSON.stringify(test.response, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <h3 className="font-semibold mb-2">Test Summary</h3>
            <p>
              Passed: {testResults.filter((t) => t.passed).length} /{" "}
              {testResults.length}
            </p>
            <p>
              Success Rate:{" "}
              {Math.round(
                (testResults.filter((t) => t.passed).length /
                  testResults.length) *
                  100
              )}
              %
            </p>
          </div>
        </div>
      )}

      {/* IP Filtering Dashboard */}
      <div className="mt-8">
        <IpFilteringDashboard />
      </div>
    </div>
  );
};

export default TestIpFilteringPage;
