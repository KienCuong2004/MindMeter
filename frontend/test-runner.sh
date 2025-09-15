#!/bin/bash

# MindMeter Frontend Test Runner
# This script runs all tests with coverage and generates reports

echo "🧪 Starting MindMeter Frontend Tests..."

# Set environment variables
export CI=true
export REACT_APP_API_URL=http://localhost:8080

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Run tests with coverage
echo "🔬 Running tests with coverage..."
npm test -- --coverage --watchAll=false --passWithNoTests

# Check test results
if [ $? -eq 0 ]; then
    echo "✅ All tests passed successfully!"
    echo "📊 Coverage report: coverage/lcov-report/index.html"
else
    echo "❌ Some tests failed. Check the output above."
    exit 1
fi

echo "🎉 Test execution completed!"
