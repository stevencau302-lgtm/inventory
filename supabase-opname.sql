-- ============================================
-- RIWAYAT STOK OPNAME
-- Tabel baru: stock_opnames (header) + stock_opname_items (detail koreksi)
-- Sudah dijalankan di Supabase (SQL Editor). File ini hanya arsip.
-- ============================================

CREATE TABLE IF NOT EXISTS stock_opnames (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  opname_date DATE NOT NULL,
  total_checked INT NOT NULL DEFAULT 0,
  match_count INT NOT NULL DEFAULT 0,
  mismatch_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stock_opname_items (
  id TEXT PRIMARY KEY,
  opname_id TEXT NOT NULL REFERENCES stock_opnames(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  product_id TEXT,
  product_name TEXT NOT NULL,
  sku TEXT,
  system_stock INT NOT NULL,
  actual_stock INT NOT NULL,
  difference INT NOT NULL,
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE stock_opnames ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_opname_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own stock_opnames" ON stock_opnames
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own stock_opname_items" ON stock_opname_items
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_stock_opnames_user ON stock_opnames(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_opname_items_opname ON stock_opname_items(opname_id);
