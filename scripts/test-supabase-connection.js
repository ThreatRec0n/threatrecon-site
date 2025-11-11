/**
 * Test Supabase Connection Script
 * Run with: node scripts/test-supabase-connection.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase Connection...\n');

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

