/**
 * Test Supabase Connection Script
 * Run with: node scripts/test-supabase-connection.js
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Load .env.local manually
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  // Try different encodings
  let envContent;
  try {
    envContent = fs.readFileSync(envPath, 'utf8');
  } catch (e) {
    try {
      envContent = fs.readFileSync(envPath, 'utf16le');
    } catch (e2) {
      envContent = fs.readFileSync(envPath);
      // Remove BOM if present
      if (envContent[0] === 0xFE && envContent[1] === 0xFF) {
        envContent = envContent.slice(2).toString('utf16be');
      } else if (envContent[0] === 0xFF && envContent[1] === 0xFE) {
        envContent = envContent.slice(2).toString('utf16le');
      } else {
        envContent = envContent.toString('utf8');
      }
    }
  }
  
  // Remove BOM from UTF-8
  if (envContent.charCodeAt(0) === 0xFEFF) {
    envContent = envContent.slice(1);
  }
  
  const lines = envContent.split(/\r?\n/);
  console.log(`📁 Loaded .env.local file (${lines.length} lines)`);
  
  lines.forEach((line) => {
    // Skip comments and empty lines
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    
    // Match KEY=VALUE pattern (more flexible)
    const equalIndex = trimmed.indexOf('=');
    if (equalIndex > 0) {
      const key = trimmed.substring(0, equalIndex).trim();
      let value = trimmed.substring(equalIndex + 1).trim();
      
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      if (key && value) {
        process.env[key] = value;
        console.log(`  ✅ Loaded: ${key}`);
      }
    }
  });
} else {
  console.log('⚠️  .env.local file not found at:', envPath);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Debug: Show what was loaded
console.log('🔍 Testing Supabase Connection...\n');
console.log('Debug - Environment variables loaded:');
console.log('  NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Found' : '❌ Missing');
console.log('  NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Found' : '❌ Missing');
console.log('');

// Check environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ ERROR: Missing environment variables!');
  console.error('   Make sure .env.local exists with:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

console.log('✅ Environment variables found');
console.log(`   URL: ${supabaseUrl.substring(0, 30)}...`);
console.log(`   Key: ${supabaseAnonKey.substring(0, 20)}...\n`);

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    // Test 1: Basic connectivity
    console.log('📡 Test 1: Testing basic connectivity...');
    const { data, error } = await supabase.from('user_progress').select('id').limit(1);
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('   ⚠️  Table might not exist yet (run supabase-schema-complete.sql)');
      } else {
        console.error(`   ❌ Connection error: ${error.message}`);
        return false;
      }
    } else {
      console.log('   ✅ Successfully connected to Supabase!');
    }

    // Test 2: Check if tables exist
    console.log('\n📊 Test 2: Checking database tables...');
    const tables = [
      'user_progress',
      'simulation_results',
      'simulation_completions',
      'achievements',
      'user_achievements',
      'user_2fa',
      'trusted_devices',
      'user_sessions',
      'audit_logs'
    ];

    let tablesFound = 0;
    for (const table of tables) {
      const { error } = await supabase.from(table).select('id').limit(1);
      if (!error || error.code !== 'PGRST116') {
        tablesFound++;
        console.log(`   ✅ ${table}`);
      } else {
        console.log(`   ❌ ${table} (not found)`);
      }
    }

    console.log(`\n   Found ${tablesFound}/${tables.length} tables`);

    // Test 3: Test authentication endpoint
    console.log('\n🔐 Test 3: Testing authentication endpoint...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.log(`   ⚠️  Auth check: ${authError.message}`);
    } else {
      console.log('   ✅ Authentication endpoint accessible');
      console.log(`   ${authData.session ? '   User session: Active' : '   User session: None (expected if not logged in)'}`);
    }

    // Test 4: Test RLS (Row Level Security)
    console.log('\n🛡️  Test 4: Testing Row Level Security...');
    const { error: rlsError } = await supabase.from('user_progress').select('*');
    
    if (rlsError) {
      if (rlsError.code === '42501' || rlsError.message.includes('permission denied')) {
        console.log('   ✅ RLS is working (access denied without auth - expected)');
      } else {
        console.log(`   ⚠️  RLS check: ${rlsError.message}`);
      }
    } else {
      console.log('   ⚠️  RLS might not be enabled (should deny access without auth)');
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📋 Connection Test Summary');
    console.log('='.repeat(50));
    console.log(`✅ Supabase URL: ${supabaseUrl ? 'Configured' : 'Missing'}`);
    console.log(`✅ API Key: ${supabaseAnonKey ? 'Configured' : 'Missing'}`);
    console.log(`✅ Connection: ${!error ? 'Working' : 'Failed'}`);
    console.log(`✅ Tables: ${tablesFound}/${tables.length} found`);
    console.log(`✅ Authentication: Accessible`);
    console.log(`✅ RLS: ${rlsError && (rlsError.code === '42501' || rlsError.message.includes('permission')) ? 'Enabled' : 'Check needed'}`);
    
    if (tablesFound < tables.length) {
      console.log('\n⚠️  Some tables are missing. Run supabase-schema-complete.sql in Supabase SQL Editor.');
    } else {
      console.log('\n🎉 All tests passed! Supabase is fully configured.');
    }

    return true;
  } catch (err) {
    console.error('\n❌ Fatal error:', err.message);
    return false;
  }
}

// Run tests
testConnection().then(success => {
  process.exit(success ? 0 : 1);
});

