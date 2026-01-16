import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Server-side Supabase client with service role for storage operations
 * Only use this in API routes, never expose to frontend
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

export const STORAGE_BUCKET = 'autorizacoes-pdfs';

/**
 * Upload PDF to Supabase Storage
 * 
 * @param filename - Name of the file (with .pdf extension)
 * @param buffer - PDF file buffer
 * @param userId - User ID for storage path organization
 * @returns Public URL of the uploaded file
 */
export async function uploadPdfToStorage(
    filename: string,
    buffer: Buffer,
    userId: string
): Promise<string> {
    const filePath = `${userId}/${filename}`;

    console.log(`[Storage] Uploading PDF to: ${STORAGE_BUCKET}/${filePath}`);

    const { data, error } = await supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, buffer, {
            contentType: 'application/pdf',
            upsert: true, // Overwrite if exists
        });

    if (error) {
        console.error('[Storage] Upload error:', error);
        throw new Error(`Failed to upload PDF: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

    console.log('[Storage] Upload successful:', publicUrl);
    return publicUrl;
}

/**
 * Download PDF from Supabase Storage as Buffer
 * 
 * @param pdfUrl - Full public URL or storage path
 * @returns PDF file as Buffer
 */
export async function downloadPdfFromStorage(pdfUrl: string): Promise<Buffer> {
    // Extract file path from URL
    const urlParts = pdfUrl.split(`${STORAGE_BUCKET}/`);
    if (urlParts.length < 2) {
        throw new Error('Invalid PDF URL format');
    }

    const filePath = urlParts[1];

    console.log(`[Storage] Downloading PDF from: ${STORAGE_BUCKET}/${filePath}`);

    const { data, error } = await supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .download(filePath);

    if (error) {
        console.error('[Storage] Download error:', error);
        throw new Error(`Failed to download PDF: ${error.message}`);
    }

    // Convert Blob to Buffer
    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

/**
 * Delete PDF from Supabase Storage
 * 
 * @param pdfUrl - Full public URL or storage path
 */
export async function deletePdfFromStorage(pdfUrl: string): Promise<void> {
    const urlParts = pdfUrl.split(`${STORAGE_BUCKET}/`);
    if (urlParts.length < 2) {
        throw new Error('Invalid PDF URL format');
    }

    const filePath = urlParts[1];

    console.log(`[Storage] Deleting PDF: ${STORAGE_BUCKET}/${filePath}`);

    const { error } = await supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .remove([filePath]);

    if (error) {
        console.error('[Storage] Delete error:', error);
        throw new Error(`Failed to delete PDF: ${error.message}`);
    }
}
