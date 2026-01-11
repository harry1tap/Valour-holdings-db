#!/usr/bin/env node

/**
 * Security Test Runner
 * Executes SQL security tests against Supabase database
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials in .env file');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSqlFile(filePath) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Executing: ${path.basename(filePath)}`);
  console.log('='.repeat(80));

  const sql = fs.readFileSync(filePath, 'utf8');

  try {
    // Execute SQL using Supabase's RPC or direct query
    // Note: Supabase client doesn't support direct SQL execution
    // We need to use a different approach

    const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql });

    if (error) {
      console.error('Error executing SQL:', error.message);
      return false;
    }

    console.log('✓ SQL executed successfully');
    if (data) {
      console.log('Result:', JSON.stringify(data, null, 2));
    }
    return true;
  } catch (err) {
    console.error('Exception:', err.message);
    return false;
  }
}

async function runTests() {
  console.log('Security Test Runner');
  console.log('='.repeat(80));
  console.log('Supabase URL:', supabaseUrl);
  console.log('Using service role key for admin access');
  console.log('');

  const testDir = path.join(__dirname, '..', 'sql', 'tests');

  // Test files to run in order
  const testFiles = [
    '000_setup_test_data.sql',
    'rbac_security_tests.sql'
  ];

  let allPassed = true;

  for (const testFile of testFiles) {
    const filePath = path.join(testDir, testFile);

    if (!fs.existsSync(filePath)) {
      console.error(`Error: Test file not found: ${testFile}`);
      allPassed = false;
      continue;
    }

    const success = await executeSqlFile(filePath);
    if (!success) {
      allPassed = false;
    }
  }

  console.log(`\n${'='.repeat(80)}`);
  if (allPassed) {
    console.log('✓ All tests completed');
  } else {
    console.log('✗ Some tests failed');
    process.exit(1);
  }
  console.log('='.repeat(80));
}

runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
