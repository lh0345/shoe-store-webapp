-- Complete Database Setup for ShoeWebapp
-- Run this in Supabase SQL editor to set up the database from scratch
-- This will DROP any existing tables and recreate them with the correct schema
-- Creates: products, orders, wishlist tables

-- ============================================
-- CLEANUP: Drop existing tables if they exist
-- ============================================
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS wishlist CASCADE;

-- ============================================
-- ENABLE EXTENSIONS (if needed)
-- ============================================
-- Note: UUID extension not needed since we're using SERIAL

-- ============================================
-- PRODUCTS TABLE
-- ============================================
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  brand TEXT,
  price DECIMAL(10, 2) NOT NULL,
  old_price DECIMAL(10, 2),
  colors TEXT[] NOT NULL DEFAULT '{}',
  sizes TEXT[] NOT NULL DEFAULT '{}',
  unavailable_sizes TEXT[] DEFAULT '{}',
  images JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  type TEXT DEFAULT 'sneakers',
  gender TEXT DEFAULT 'unisex',
  material TEXT,
  style TEXT,
  featured BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_type ON products(type);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_featured ON products(featured);
CREATE INDEX idx_products_active ON products(active);
CREATE INDEX idx_products_tags ON products USING GIN(tags);

-- ============================================
-- WISHLIST TABLE
-- ============================================
CREATE TABLE wishlist (
  id SERIAL PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  product_ids JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for user_id
CREATE INDEX idx_wishlist_user_id ON wishlist(user_id);
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) DEFAULT 0,
  shipping DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'MKD',
  status TEXT DEFAULT 'pending',
  payment_method TEXT,
  shipping_address JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for orders
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Products policies - Allow public read access to active products
CREATE POLICY "Products are viewable by everyone" ON products
  FOR SELECT USING (active = true);

-- Allow service role full access (for admin operations via server)
CREATE POLICY "Service role has full access to products" ON products
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Enable RLS on wishlist table
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

-- Wishlist policies - Users can only access their own wishlist
CREATE POLICY "Users can view their own wishlist" ON wishlist
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own wishlist" ON wishlist
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own wishlist" ON wishlist
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Service role can access all wishlists (for admin operations)
CREATE POLICY "Service role has full access to wishlists" ON wishlist
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Enable RLS on orders table (already enabled above)
-- Orders policies - Users can only access their own orders
CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT USING (auth.uid()::text = customer_email);

CREATE POLICY "Users can create their own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid()::text = customer_email);

CREATE POLICY "Users can update their own pending orders" ON orders
  FOR UPDATE USING (auth.uid()::text = customer_email AND status = 'pending');

-- Service role can access all orders (for admin operations)
CREATE POLICY "Service role has full access to orders" ON orders
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wishlist_updated_at BEFORE UPDATE ON wishlist
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INITIAL DATA (Optional)
-- ============================================

-- You can uncomment and modify these INSERT statements to add initial products
/*
INSERT INTO products (slug, name, brand, price, colors, sizes, description, type, gender) VALUES
('classic-leather-low', 'Classic Leather Low', 'Heritage', 6150.00, ARRAY['#FFFFFF', '#000000', '#8B4513'], ARRAY['36', '37', '38', '39', '40', '41', '42', '43'], 'Timeless leather sneakers with a minimalist design. Versatile and durable.', 'sneakers', 'unisex'),
('trail-blazer-boots', 'Trail Blazer Boots', 'MountainPeak', 12300.00, ARRAY['#8B4513', '#2F4F4F', '#000000'], ARRAY['39', '40', '41', '42', '43'], 'Rugged hiking boots designed for outdoor adventures. Waterproof and comfortable.', 'boots', 'unisex');
*/

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
SELECT '✅ Database setup complete! You can now sync products using the sync-to-supabase.js script.' as status;
