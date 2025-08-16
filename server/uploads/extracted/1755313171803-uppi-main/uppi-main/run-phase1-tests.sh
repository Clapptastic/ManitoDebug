#!/bin/bash

echo "🚀 Running Phase 1 Production Test Validation"
echo "=============================================="

# Run the production test suite
echo "Running production test suite..."
npx jest src/__tests__/phase1/production-test-suite.ts --verbose --no-cache

echo ""
echo "Running basic test verification..."
npx jest src/__tests__/phase1/basic-test.ts --verbose --no-cache

echo ""
echo "✅ Phase 1 Test Validation Complete!"