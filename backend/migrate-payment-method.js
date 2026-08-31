/**
 * Migration: Add payment_method column to orders table
 * Run once: node migrate-payment-method.js
 */
require('dotenv').config();
const supabase = require('./db');

const run = async () => {
  try {
    console.log('📦 Adding payment_method column to orders...');
    
    // Use Supabase's RPC to run raw SQL, or use the REST API approach
    // First, try to add the column via a direct query
    const { error } = await supabase.rpc('exec_sql', {
      sql: "ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'COD'"
    });

    if (error) {
      // If RPC doesn't exist, try alternative approach
      // The column will be added when first order with payment_method is created
      // Supabase auto-handles new columns if schema is flexible
      console.log('⚠️  Could not run ALTER TABLE via RPC:', error.message);
      console.log('');
      console.log('Please run this SQL manually in your Supabase SQL Editor:');
      console.log('');
      console.log("  ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'COD';");
      console.log('');
      console.log('You can find the SQL Editor at:');
      console.log('  Supabase Dashboard → SQL Editor → New Query');
      return;
    }

    console.log('✅ Migration complete! payment_method column added.\n');
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.log('');
    console.log('Please run this SQL manually in your Supabase SQL Editor:');
    console.log('');
    console.log("  ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'COD';");
    process.exit(1);
  }
};

run();
