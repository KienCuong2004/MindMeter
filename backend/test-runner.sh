#!/bin/bash

# MindMeter Backend Test Runner
# This script runs all tests with coverage and generates reports

echo "🧪 Starting MindMeter Backend Tests..."

# Set environment variables
export SPRING_PROFILES_ACTIVE=test
export MAVEN_OPTS="-Xmx1024m -XX:MaxPermSize=256m"

# Clean and compile
echo "📦 Cleaning and compiling..."
mvn clean compile

# Run unit tests
echo "🔬 Running unit tests..."
mvn test -Dtest="*Test" -DfailIfNoTests=false

# Run integration tests
echo "🔗 Running integration tests..."
mvn test -Dtest="*IntegrationTest" -DfailIfNoTests=false

# Run all tests with coverage
echo "📊 Running tests with coverage..."
mvn jacoco:report

# Generate test report
echo "📋 Generating test report..."
mvn surefire-report:report

# Check test results
if [ $? -eq 0 ]; then
    echo "✅ All tests passed successfully!"
    echo "📊 Coverage report: target/site/jacoco/index.html"
    echo "📋 Test report: target/site/surefire-report.html"
else
    echo "❌ Some tests failed. Check the output above."
    exit 1
fi

echo "🎉 Test execution completed!"
