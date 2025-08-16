#!/bin/bash

echo "Running Competitor Analysis Integration Tests..."
echo "=============================================="

# Run the integration tests specifically for competitor analysis
npx jest --testMatch='**/__tests__/integration/**/*.test.[jt]s?(x)' --verbose

echo ""
echo "Test execution completed!"