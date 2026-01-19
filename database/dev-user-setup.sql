-- Script para criar usuário de desenvolvimento
-- Execute este SQL no Supabase SQL Editor

-- Inserir usuário de desenvolvimento (se não existir)
INSERT INTO public.users (id, email, password_hash, name, role, bitrix_user_id, created_at, updated_at)
VALUES (
    38931, 
    'dev@localhost', 
    'dev-password-hash', -- Senha não será usada em desenvolvimento
    'Desenvolvimento User', 
    'admin', 
    38931, -- Espelha o ID do Bitrix24
    NOW(), 
    NOW()
)
ON CONFLICT (id) DO NOTHING; -- Não faz nada se já existir

-- Verificar se foi criado
SELECT * FROM public.users WHERE id = 38931;
