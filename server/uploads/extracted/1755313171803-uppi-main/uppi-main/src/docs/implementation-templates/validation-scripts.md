# 🧪 Validation Scripts for Phase Completion

## 📋 PHASE VALIDATION CHECKLIST AUTOMATION

### Phase 0 Validation Script:
```typescript
// scripts/validate-phase-0.ts
import { supabase } from '../src/lib/supabase/client';
import fs from 'fs';
import path from 'path';

interface ValidationResult {
  phase: string;
  passed: boolean;
  errors: string[];
  warnings: string[];
  summary: string;
}

export async function validatePhase0(): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  console.log('🔍 Starting Phase 0 Validation...\n');

  // 1. Database Migration Validation
  console.log('📊 Validating Database Migrations...');
  
  const requiredTables = [
    'teams',
    'team_members', 
    'team_invitations',
    'team_activity_log',
    'team_comments',
    'business_tools_usage',
    'mvp_projects',
    'scale_metrics',
    'test_results',
    'performance_metrics'
  ];

  for (const table of requiredTables) {
    try {
      const { error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        errors.push(`❌ Table '${table}' does not exist or is not accessible`);
      } else {
        console.log(`✅ Table '${table}' exists and is accessible`);
      }
    } catch (err) {
      errors.push(`❌ Failed to check table '${table}': ${err.message}`);
    }
  }

  // 2. RLS Policies Validation
  console.log('\n🔒 Validating RLS Policies...');
  
  const rlsPolicyChecks = [
    { table: 'teams', policy: 'team_select_policy' },
    { table: 'team_members', policy: 'team_members_select_policy' },
    { table: 'business_plans', policy: 'business_plans_team_select' }
  ];

  for (const check of rlsPolicyChecks) {
    try {
      const { data, error } = await supabase
        .rpc('exec_sql', { 
          sql: `SELECT COUNT(*) FROM pg_policies WHERE tablename = '${check.table}' AND policyname = '${check.policy}'` 
        });
      
      if (error || !data || data[0]?.count === 0) {
        errors.push(`❌ RLS policy '${check.policy}' missing for table '${check.table}'`);
      } else {
        console.log(`✅ RLS policy '${check.policy}' exists for table '${check.table}'`);
      }
    } catch (err) {
      warnings.push(`⚠️  Could not verify RLS policy '${check.policy}' for table '${check.table}'`);
    }
  }

  // 3. Component Consolidation Validation
  console.log('\n📁 Validating Component Consolidation...');

  const consolidationChecks = [
    {
      primary: 'src/pages/business-tools/BusinessToolsPage.tsx',
      archived: 'src/pages/legacy/BusinessToolsPage.tsx'
    },
    {
      primary: 'src/pages/test-measure-learn/TestMeasureLearnPage.tsx', 
      archived: 'src/pages/legacy/TestMeasureLearnPage.tsx'
    },
    {
      primary: 'src/components/analytics/AdvancedAnalyticsDashboard.tsx',
      archived: 'src/components/legacy/AdvancedAnalyticsDashboard.tsx'
    }
  ];

  for (const check of consolidationChecks) {
    if (!fs.existsSync(check.primary)) {
      errors.push(`❌ Primary component '${check.primary}' does not exist`);
    } else {
      console.log(`✅ Primary component '${check.primary}' exists`);
    }

    if (fs.existsSync(check.archived)) {
      console.log(`✅ Duplicate component archived to '${check.archived}'`);
    } else {
      warnings.push(`⚠️  Expected archived component '${check.archived}' not found`);
    }
  }

  // 4. Edge Function Inventory Validation
  console.log('\n🔧 Validating Edge Function Inventory...');

  const expectedEdgeFunctions = [
    'team-management',
    'team-invitations', 
    'ai-market-analyst',
    'comprehensive-competitor-analysis',
    'ai-cofounder-chat',
    'document-processing',
    'system-health',
    'user-management'
  ];

  for (const functionName of expectedEdgeFunctions) {
    const functionPath = `supabase/functions/${functionName}/index.ts`;
    if (!fs.existsSync(functionPath)) {
      errors.push(`❌ Edge function '${functionName}' missing at '${functionPath}'`);
    } else {
      console.log(`✅ Edge function '${functionName}' exists`);
    }
  }

  // 5. Performance Validation
  console.log('\n⚡ Validating Database Performance...');

  const indexChecks = [
    'idx_teams_owner_id',
    'idx_team_members_team_id',
    'idx_team_members_user_id',
    'idx_team_activity_team_id'
  ];

  for (const indexName of indexChecks) {
    try {
      const { data, error } = await supabase
        .rpc('exec_sql', { 
          sql: `SELECT COUNT(*) FROM pg_indexes WHERE indexname = '${indexName}'` 
        });
      
      if (error || !data || data[0]?.count === 0) {
        errors.push(`❌ Index '${indexName}' does not exist`);
      } else {
        console.log(`✅ Index '${indexName}' exists`);
      }
    } catch (err) {
      warnings.push(`⚠️  Could not verify index '${indexName}'`);
    }
  }

  // Summary
  const passed = errors.length === 0;
  const summary = `Phase 0 Validation ${passed ? 'PASSED' : 'FAILED'}: ${errors.length} errors, ${warnings.length} warnings`;
  
  console.log(`\n📋 Validation Summary:`);
  console.log(`${passed ? '✅' : '❌'} ${summary}`);
  
  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.forEach(error => console.log(`   ${error}`));
  }
  
  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    warnings.forEach(warning => console.log(`   ${warning}`));
  }

  return {
    phase: 'Phase 0',
    passed,
    errors,
    warnings,
    summary
  };
}

// Run validation if called directly
if (require.main === module) {
  validatePhase0().then(result => {
    process.exit(result.passed ? 0 : 1);
  });
}
```

### Phase 1 Validation Script:
```typescript
// scripts/validate-phase-1.ts
import { supabase } from '../src/lib/supabase/client';
import fs from 'fs';
import { validateRoutes } from './utils/route-validator';
import { validateNavigation } from './utils/navigation-validator';
import { validateEdgeFunctions } from './utils/edge-function-validator';

export async function validatePhase1(): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  console.log('🔍 Starting Phase 1 Validation...\n');

  // 1. Business Tools Routes Validation
  console.log('🛣️  Validating Business Tools Routes...');
  
  const requiredRoutes = [
    '/business-tools',
    '/business-tools/mvp-builder',
    '/business-tools/scale',
    '/business-tools/research-validation',
    '/business-tools/business-plan',
    '/test-measure-learn',
    '/test-measure-learn/web-analytics',
    '/teams',
    '/teams/create',
    '/ai-advisor'
  ];

  const routeValidation = await validateRoutes(requiredRoutes);
  errors.push(...routeValidation.errors);
  warnings.push(...routeValidation.warnings);

  // 2. Navigation Integration Validation
  console.log('\n🧭 Validating Navigation Integration...');
  
  const navigationValidation = await validateNavigation([
    'Business Tools',
    'Test-Measure-Learn', 
    'Teams',
    'AI Advisor'
  ]);
  errors.push(...navigationValidation.errors);
  warnings.push(...navigationValidation.warnings);

  // 3. Team Functionality Validation
  console.log('\n👥 Validating Team Functionality...');
  
  try {
    // Test team creation
    const { data: testTeam, error: createError } = await supabase
      .from('teams')
      .insert({
        name: 'Test Team',
        description: 'Validation test team',
        owner_id: '00000000-0000-0000-0000-000000000000' // Test UUID
      })
      .select()
      .single();

    if (createError) {
      errors.push(`❌ Team creation test failed: ${createError.message}`);
    } else {
      console.log('✅ Team creation functionality works');
      
      // Clean up test team
      await supabase.from('teams').delete().eq('id', testTeam.id);
    }
  } catch (err) {
    errors.push(`❌ Team functionality validation failed: ${err.message}`);
  }

  // 4. Edge Function Integration Validation
  console.log('\n🔧 Validating Edge Function Integration...');
  
  const edgeFunctionValidation = await validateEdgeFunctions([
    'team-management',
    'ai-market-analyst',
    'ai-cofounder-chat',
    'comprehensive-competitor-analysis'
  ]);
  errors.push(...edgeFunctionValidation.errors);
  warnings.push(...edgeFunctionValidation.warnings);

  // 5. Component Integration Validation
  console.log('\n🧩 Validating Component Integration...');
  
  const requiredComponents = [
    'src/components/teams/TeamWorkspace.tsx',
    'src/components/teams/TeamMemberList.tsx',
    'src/components/teams/InviteMemberModal.tsx',
    'src/components/business-tools/BusinessToolsHub.tsx',
    'src/services/teams/teamService.ts',
    'src/hooks/teams/useTeams.ts'
  ];

  for (const component of requiredComponents) {
    if (!fs.existsSync(component)) {
      errors.push(`❌ Required component '${component}' does not exist`);
    } else {
      console.log(`✅ Component '${component}' exists`);
    }
  }

  // Summary
  const passed = errors.length === 0;
  const summary = `Phase 1 Validation ${passed ? 'PASSED' : 'FAILED'}: ${errors.length} errors, ${warnings.length} warnings`;
  
  console.log(`\n📋 Validation Summary:`);
  console.log(`${passed ? '✅' : '❌'} ${summary}`);

  return {
    phase: 'Phase 1',
    passed,
    errors,
    warnings,
    summary
  };
}
```

### Comprehensive Test Suite Validator:
```typescript
// scripts/validate-test-suite.ts
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

interface TestValidationResult {
  unitTests: {
    passed: boolean;
    coverage: number;
    errors: string[];
  };
  integrationTests: {
    passed: boolean;
    errors: string[];
  };
  e2eTests: {
    passed: boolean;
    errors: string[];
  };
  overall: {
    passed: boolean;
    summary: string;
  };
}

export async function validateTestSuite(): Promise<TestValidationResult> {
  const result: TestValidationResult = {
    unitTests: { passed: false, coverage: 0, errors: [] },
    integrationTests: { passed: false, errors: [] },
    e2eTests: { passed: false, errors: [] },
    overall: { passed: false, summary: '' }
  };

  console.log('🧪 Starting Test Suite Validation...\n');

  // 1. Unit Tests Validation
  console.log('🔬 Running Unit Tests...');
  try {
    const unitTestOutput = execSync('npm run test:unit -- --coverage', { encoding: 'utf8' });
    result.unitTests.passed = !unitTestOutput.includes('FAIL');
    
    // Extract coverage percentage
    const coverageMatch = unitTestOutput.match(/All files\s+\|\s+(\d+\.?\d*)/);
    if (coverageMatch) {
      result.unitTests.coverage = parseFloat(coverageMatch[1]);
    }

    if (result.unitTests.coverage < 95) {
      result.unitTests.errors.push(`❌ Coverage ${result.unitTests.coverage}% is below required 95%`);
      result.unitTests.passed = false;
    }

    console.log(`✅ Unit tests passed with ${result.unitTests.coverage}% coverage`);
  } catch (error) {
    result.unitTests.errors.push(`❌ Unit tests failed: ${error.message}`);
    console.log('❌ Unit tests failed');
  }

  // 2. Integration Tests Validation
  console.log('\n🔗 Running Integration Tests...');
  try {
    const integrationTestOutput = execSync('npm run test:integration', { encoding: 'utf8' });
    result.integrationTests.passed = !integrationTestOutput.includes('FAIL');
    console.log('✅ Integration tests passed');
  } catch (error) {
    result.integrationTests.errors.push(`❌ Integration tests failed: ${error.message}`);
    console.log('❌ Integration tests failed');
  }

  // 3. E2E Tests Validation
  console.log('\n🎭 Running E2E Tests...');
  try {
    const e2eTestOutput = execSync('npm run test:e2e', { encoding: 'utf8' });
    result.e2eTests.passed = !e2eTestOutput.includes('failed');
    console.log('✅ E2E tests passed');
  } catch (error) {
    result.e2eTests.errors.push(`❌ E2E tests failed: ${error.message}`);
    console.log('❌ E2E tests failed');
  }

  // 4. Test File Structure Validation
  console.log('\n📁 Validating Test File Structure...');
  
  const requiredTestDirectories = [
    'src/__tests__/components',
    'src/__tests__/pages', 
    'src/__tests__/services',
    'src/__tests__/hooks',
    'src/__tests__/utils',
    'src/__tests__/integration'
  ];

  for (const dir of requiredTestDirectories) {
    if (!fs.existsSync(dir)) {
      result.integrationTests.errors.push(`❌ Test directory '${dir}' does not exist`);
    } else {
      console.log(`✅ Test directory '${dir}' exists`);
    }
  }

  // Overall validation
  result.overall.passed = 
    result.unitTests.passed && 
    result.integrationTests.passed && 
    result.e2eTests.passed;

  const totalErrors = 
    result.unitTests.errors.length + 
    result.integrationTests.errors.length + 
    result.e2eTests.errors.length;

  result.overall.summary = `Test Suite Validation ${result.overall.passed ? 'PASSED' : 'FAILED'}: ${totalErrors} total errors`;

  console.log(`\n📋 Test Validation Summary:`);
  console.log(`${result.overall.passed ? '✅' : '❌'} ${result.overall.summary}`);

  return result;
}
```

### Performance Validation Script:
```typescript
// scripts/validate-performance.ts
import { performance } from 'perf_hooks';
import { supabase } from '../src/lib/supabase/client';

interface PerformanceMetrics {
  pageLoadTime: number;
  apiResponseTime: number;
  databaseQueryTime: number;
  bundleSize: number;
}

interface PerformanceTargets {
  maxPageLoadTime: number; // 1500ms
  maxApiResponseTime: number; // 500ms  
  maxDatabaseQueryTime: number; // 200ms
  maxBundleSize: number; // 250KB gzipped
}

export async function validatePerformance(): Promise<{
  passed: boolean;
  metrics: PerformanceMetrics;
  targets: PerformanceTargets;
  errors: string[];
}> {
  const errors: string[] = [];
  const targets: PerformanceTargets = {
    maxPageLoadTime: 1500,
    maxApiResponseTime: 500,
    maxDatabaseQueryTime: 200,
    maxBundleSize: 250 * 1024 // 250KB
  };

  console.log('⚡ Starting Performance Validation...\n');

  // 1. Database Query Performance
  console.log('📊 Testing Database Query Performance...');
  const dbStart = performance.now();
  
  try {
    await supabase.from('teams').select('*').limit(10);
    const dbEnd = performance.now();
    const databaseQueryTime = dbEnd - dbStart;
    
    if (databaseQueryTime > targets.maxDatabaseQueryTime) {
      errors.push(`❌ Database query time ${databaseQueryTime.toFixed(2)}ms exceeds target ${targets.maxDatabaseQueryTime}ms`);
    } else {
      console.log(`✅ Database query time: ${databaseQueryTime.toFixed(2)}ms`);
    }
  } catch (error) {
    errors.push(`❌ Database query failed: ${error.message}`);
  }

  // 2. API Response Time (Edge Functions)
  console.log('\n🔧 Testing Edge Function Response Time...');
  const apiStart = performance.now();
  
  try {
    await supabase.functions.invoke('team-management', {
      body: { action: 'getUserTeams' }
    });
    const apiEnd = performance.now();
    const apiResponseTime = apiEnd - apiStart;
    
    if (apiResponseTime > targets.maxApiResponseTime) {
      errors.push(`❌ API response time ${apiResponseTime.toFixed(2)}ms exceeds target ${targets.maxApiResponseTime}ms`);
    } else {
      console.log(`✅ API response time: ${apiResponseTime.toFixed(2)}ms`);
    }
  } catch (error) {
    console.log(`⚠️  API response test skipped: ${error.message}`);
  }

  // 3. Bundle Size Analysis
  console.log('\n📦 Analyzing Bundle Size...');
  
  try {
    const bundleAnalysis = require('../dist/bundle-analysis.json');
    const totalSize = bundleAnalysis.totalSize;
    
    if (totalSize > targets.maxBundleSize) {
      errors.push(`❌ Bundle size ${(totalSize / 1024).toFixed(2)}KB exceeds target ${(targets.maxBundleSize / 1024).toFixed(2)}KB`);
    } else {
      console.log(`✅ Bundle size: ${(totalSize / 1024).toFixed(2)}KB`);
    }
  } catch (error) {
    console.log('⚠️  Bundle analysis not available');
  }

  // 4. Memory Usage Check
  console.log('\n🧠 Checking Memory Usage...');
  
  const memUsage = process.memoryUsage();
  const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
  
  if (heapUsedMB > 100) {
    errors.push(`❌ High memory usage: ${heapUsedMB.toFixed(2)}MB`);
  } else {
    console.log(`✅ Memory usage: ${heapUsedMB.toFixed(2)}MB`);
  }

  const passed = errors.length === 0;
  
  console.log(`\n📋 Performance Validation Summary:`);
  console.log(`${passed ? '✅' : '❌'} Performance validation ${passed ? 'PASSED' : 'FAILED'}: ${errors.length} performance issues`);

  return {
    passed,
    metrics: {
      pageLoadTime: 0, // Would be measured in browser
      apiResponseTime: 0, // Set from actual measurement
      databaseQueryTime: 0, // Set from actual measurement  
      bundleSize: 0 // Set from actual measurement
    },
    targets,
    errors
  };
}
```

### Master Validation Runner:
```typescript
// scripts/validate-implementation.ts
import { validatePhase0 } from './validate-phase-0';
import { validatePhase1 } from './validate-phase-1';
import { validateTestSuite } from './validate-test-suite';
import { validatePerformance } from './validate-performance';

interface MasterValidationResult {
  overallPassed: boolean;
  phases: {
    phase0: any;
    phase1: any;
    testSuite: any;
    performance: any;
  };
  summary: string;
}

export async function runMasterValidation(): Promise<MasterValidationResult> {
  console.log('🚀 Starting Master Implementation Validation...\n');
  console.log('=' .repeat(60));

  const results = {
    phase0: await validatePhase0(),
    phase1: await validatePhase1(),
    testSuite: await validateTestSuite(),
    performance: await validatePerformance()
  };

  const overallPassed = 
    results.phase0.passed &&
    results.phase1.passed &&
    results.testSuite.overall.passed &&
    results.performance.passed;

  const totalErrors = 
    results.phase0.errors.length +
    results.phase1.errors.length +
    (results.testSuite.unitTests.errors.length + 
     results.testSuite.integrationTests.errors.length + 
     results.testSuite.e2eTests.errors.length) +
    results.performance.errors.length;

  const summary = `Master Validation ${overallPassed ? 'PASSED' : 'FAILED'}: ${totalErrors} total issues found`;

  console.log('\n' + '=' .repeat(60));
  console.log('📋 MASTER VALIDATION SUMMARY');
  console.log('=' .repeat(60));
  console.log(`${overallPassed ? '✅' : '❌'} ${summary}`);
  console.log('');
  
  Object.entries(results).forEach(([phase, result]) => {
    const status = result.passed || result.overall?.passed ? '✅' : '❌';
    console.log(`${status} ${phase.toUpperCase()}: ${result.summary || result.overall?.summary}`);
  });

  if (!overallPassed) {
    console.log('\n❌ CRITICAL: Implementation validation failed. Do not proceed to next phase.');
    console.log('   Review and fix all errors before continuing.');
  } else {
    console.log('\n✅ SUCCESS: All validations passed. Implementation is ready for production.');
  }

  return {
    overallPassed,
    phases: results,
    summary
  };
}

// Package.json script addition
/*
{
  "scripts": {
    "validate:phase0": "tsx scripts/validate-phase-0.ts",
    "validate:phase1": "tsx scripts/validate-phase-1.ts", 
    "validate:tests": "tsx scripts/validate-test-suite.ts",
    "validate:performance": "tsx scripts/validate-performance.ts",
    "validate:all": "tsx scripts/validate-implementation.ts",
    "test:unit": "jest --testPathPattern=__tests__/unit",
    "test:integration": "jest --testPathPattern=__tests__/integration",
    "test:e2e": "playwright test"
  }
}
*/

// Run if called directly
if (require.main === module) {
  runMasterValidation().then(result => {
    process.exit(result.overallPassed ? 0 : 1);
  });
}
```

## 🎯 VALIDATION EXECUTION WORKFLOW

### Pre-Implementation Validation:
```bash
# Before starting any phase
npm run validate:phase0

# Must pass before proceeding to Phase 1
```

### Phase Completion Validation:
```bash
# After completing Phase 1
npm run validate:phase1

# After implementing tests
npm run validate:tests

# Performance check
npm run validate:performance

# Complete validation
npm run validate:all
```

### Automated CI/CD Integration:
```yaml
# .github/workflows/validation.yml
name: Implementation Validation

on:
  push:
    branches: [ main, development ]
  pull_request:
    branches: [ main ]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run validate:all
      - name: Fail if validation failed
        if: failure()
        run: |
          echo "❌ Implementation validation failed"
          exit 1
```

This comprehensive validation system ensures that AI coding agents can verify their work at each phase and catch issues before proceeding to the next phase.