-- ==================================
-- SUPABASE STORAGE BUCKET SETUP
-- Phase 3: PDF Storage Configuration
-- ==================================

-- Create storage bucket for authorization PDFs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'autorizacoes-pdfs',
    'autorizacoes-pdfs',
    true,  -- Public bucket for easier access
    10485760,  -- 10MB file size limit
    ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: Users can upload to their own folder
CREATE POLICY "Users can upload PDFs to their own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'autorizacoes-pdfs' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage policy: Users can read from their own folder
CREATE POLICY "Users can read their own PDFs"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'autorizacoes-pdfs' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage policy: Users can update their own PDFs
CREATE POLICY "Users can update their own PDFs"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'autorizacoes-pdfs' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage policy: Users can delete their own PDFs
CREATE POLICY "Users can delete their own PDFs"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'autorizacoes-pdfs' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Admin policy: Admins can access all PDFs
CREATE POLICY "Admins can access all PDFs"
ON storage.objects FOR ALL
TO authenticated
USING (
    bucket_id = 'autorizacoes-pdfs' AND
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);
