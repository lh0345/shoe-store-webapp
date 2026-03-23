#!/usr/bin/env node
/* sync-to-supabase.js - Sync local products to Supabase

   Usage: node scripts/sync-to-supabase.js

   Environment variables needed:
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY (for admin operations)

   This script:
   1. Reads local products.json
   2. Transforms to database format
   3. Upserts to Supabase (bypasses RLS with service role key)
   4. Shows sync summary
*/

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read products from JSON file
const productsFile = join(__dirname, '..', 'data', 'products.json');
const products = JSON.parse(readFileSync(productsFile, 'utf8'));

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables!');
  console.error('Create .env.local with:');
  console.error('  SUPABASE_URL=https://xxx.supabase.co');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Transform product to database format
function transformProduct(product) {
  // Helper function to parse MKD price strings like "6,150 ден"
  const parsePrice = (priceStr) => {
    if (!priceStr) return null;
    if (typeof priceStr === 'number') return priceStr;
    // Remove currency symbol and commas, then parse
    const cleaned = priceStr.toString().replace(/[^\d.,]/g, '').replace(/,/g, '');
    return parseFloat(cleaned) || null;
  };

  return {
    slug: product.slug,
    name: product.name,
    brand: product.brand || null,
    price: parsePrice(product.price),
    old_price: parsePrice(product.oldPrice),
    colors: product.colors || [],
    sizes: product.sizes || [],
    unavailable_sizes: product.unavailableSizes || [],
    images: product.images || {},
    description: product.description || '',
    tags: product.tags || [],
    type: product.type || 'general',
    gender: product.gender || 'unisex',
    material: product.material || null,
    style: product.style || null,
    featured: product.featured || false,
    active: true,
  };
}

async function syncProducts() {
  console.log('🚀 Starting product sync to Supabase...\n');

  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  for (const product of products) {
    try {
      const dbProduct = transformProduct(product);

      // Upsert product (insert or update if exists)
      const { data, error } = await supabase
        .from('products')
        .upsert(dbProduct, { onConflict: 'slug' })
        .select();

      if (error) {
        throw error;
      }

      console.log(`✅ Synced: ${product.name}`);
      successCount++;
    } catch (error) {
      console.log(`❌ Error: ${product.name} - ${error.message}`);
      errorCount++;
      errors.push({ product: product.name, error: error.message });
    }
  }

  console.log('\n📊 Sync Summary:');
  console.log(`   Total products: ${products.length}`);
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${errorCount}`);

  if (errors.length > 0) {
    console.log('\n⚠️  Errors:');
    errors.forEach(e => {
      console.log(`   - ${e.product}: ${e.error}`);
    });
  }

  // Verify sync
  console.log('\n🔍 Verifying database...');
  const { data: dbProducts, error: countError } = await supabase
    .from('products')
    .select('id, name, active', { count: 'exact' });

  if (!countError) {
    console.log(`✅ Database contains ${dbProducts.length} products`);
  }
}

// Run sync
syncProducts()
  .then(() => {
    console.log('\n✅ Sync complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Sync failed:', error);
    process.exit(1);
  });
