-- Migration: Add documents to FAQs + embedding columns
-- Run this in Supabase SQL Editor

-- 1. FAQs: add documents (JSONB array) and embedding columns
ALTER TABLE faqs ADD COLUMN IF NOT EXISTS documents jsonb DEFAULT '[]';
ALTER TABLE faqs ADD COLUMN IF NOT EXISTS embedding vector(1536);
ALTER TABLE faqs ADD COLUMN IF NOT EXISTS embedding_text text;

CREATE INDEX IF NOT EXISTS idx_faqs_embedding ON faqs 
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);

-- 2. Properties: add embedding_text
ALTER TABLE properties ADD COLUMN IF NOT EXISTS embedding_text text;

-- 3. Leads: add search_text
ALTER TABLE leads ADD COLUMN IF NOT EXISTS search_text text;

-- 4. Conversations: add tenant_id if missing
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_conversations_tenant ON conversations(tenant_id);

-- 5. Visits: add type and notes if missing
ALTER TABLE visits ADD COLUMN IF NOT EXISTS type varchar(50) DEFAULT 'visit';
ALTER TABLE visits ADD COLUMN IF NOT EXISTS notes text;

-- 6. Supabase Storage buckets (run these or create via Dashboard > Storage)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('property-images', 'property-images', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('faq-documents', 'faq-documents', true);

-- 7. Storage policies (allow anon uploads for now - tighten later)
-- CREATE POLICY "Allow public read" ON storage.objects FOR SELECT USING (bucket_id IN ('property-images', 'faq-documents'));
-- CREATE POLICY "Allow anon upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('property-images', 'faq-documents'));
-- CREATE POLICY "Allow anon delete" ON storage.objects FOR DELETE USING (bucket_id IN ('property-images', 'faq-documents'));
