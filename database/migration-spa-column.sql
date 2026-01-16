-- Migration: Update imoveis table for Bitrix24 SPA integration
-- This should be run on your Supabase SQL Editor

-- Rename column from bitrix_deal_id to bitrix_spa_item_id
ALTER TABLE public.imoveis 
RENAME COLUMN bitrix_deal_id TO bitrix_spa_item_id;

-- Update comment
COMMENT ON COLUMN public.imoveis.bitrix_spa_item_id IS 'ID do Item na SPA "Imóveis" do Bitrix24';

-- Verify the change
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'imoveis'
  AND column_name = 'bitrix_spa_item_id';
