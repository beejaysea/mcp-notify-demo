#!/usr/bin/env node

/**
 * Custom test runner script for MCP Notification System
 * 
 * This script allows running tests selectively, skipping tests that have
 * TypeScript issues while we continue improving the test suite.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const TEST_DIRS = {
  server: './src/__tests__/server/improved-server.test.ts',
  client: './src/__tests__/client',
  shared: './src/__tests__/shared',
  integration: './src/__tests__/integration',
  all: './src/__tests__',
};

function showUsage() {
  console.log('MCP Notification Test Runner');
  console.log('----------------------------');
  console.log('Usage: node scripts/run-tests.js [component]');
  console.log('');
  console.log('Options:');
  console.log('  component    Component to test: server, client, shared, integration, all');
  console.log('               Default: all working tests');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/run-tests.js shared   # Run shared component tests');
  console.log('  node scripts/run-tests.js server   # Run server tests');
  console.log('  node scripts/run-tests.js all      # Run all tests');
  console.log('');
}

function runTests(component = 'working') {
  try {
    let command;
    
    if (component === 'working') {
      // Currently, only server/improved and shared tests work without TypeScript errors
      command = `jest ${TEST_DIRS.server} ${TEST_DIRS.shared}`;
    } else if (TEST_DIRS[component]) {
      command = `jest ${TEST_DIRS[component]}`;
    } else {
      console.error(`Unknown component: ${component}`);
      showUsage();
      process.exit(1);
    }
    
    console.log(`Running tests for: ${component}`);
    console.log('Command:', command);
    console.log('---------------------------------------------------');
    
    // Run the tests
    execSync(command, { stdio: 'inherit' });
    
  } catch (error) {
    console.error('Test execution failed:');
    process.exit(1);
  }
}

// Main
function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    showUsage();
    return;
  }
  
  const component = args[0] || 'working';
  runTests(component);
}

main();