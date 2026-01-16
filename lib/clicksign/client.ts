/**
 * ClickSign API v1 Client
 * 
 * Documentation: https://developers.clicksign.com/
 */

const CLICKSIGN_API_URL = 'https://app.clicksign.com/api/v1';
const API_TOKEN = process.env.CLICKSIGN_API_TOKEN;

if (!API_TOKEN) {
    console.warn('[ClickSign] WARNING: CLICKSIGN_API_TOKEN not configured');
}

/**
 * Base fetch wrapper for ClickSign API
 */
async function clicksignFetch(endpoint: string, options: RequestInit = {}) {
    const url = `${CLICKSIGN_API_URL}${endpoint}`;

    const response = await fetch(url, {
        ...options,
        headers: {
            'Authorization': `Bearer ${API_TOKEN}`,
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    const data = await response.json();

    if (!response.ok) {
        console.error('[ClickSign] API Error:', {
            status: response.status,
            endpoint,
            error: data
        });
        throw new Error(data.errors?.[0]?.message || data.message || 'ClickSign API error');
    }

    return data;
}

/**
 * Document upload configuration
 */
export interface UploadDocumentConfig {
    path: string;              // e.g., "/Autorizacoes/autorizacao-123.pdf"
    contentBase64: string;     // Base64 encoded PDF
    deadlineAt?: string;       // ISO date string
    autoClose?: boolean;       // Auto-close when all signers sign
    locale?: string;           // Default: pt-BR
}

/**
 * Upload document to ClickSign
 */
export async function uploadDocument(config: UploadDocumentConfig) {
    console.log(`[ClickSign] Uploading document: ${config.path}`);

    const response = await clicksignFetch('/documents', {
        method: 'POST',
        body: JSON.stringify({
            document: {
                path: config.path,
                content_base64: config.contentBase64,
                deadline_at: config.deadlineAt,
                auto_close: config.autoClose ?? true,
                locale: config.locale ?? 'pt-BR',
            }
        }),
    });

    console.log('[ClickSign] Document uploaded:', response.document?.key);
    return response.document;
}

/**
 * Signer data
 */
export interface SignerData {
    email: string;
    phoneNumber?: string;
    name: string;
    documentation: string;      // CPF or CNPJ
    birthday?: string;          // YYYY-MM-DD
    hasDocumentation?: boolean;
    selfieEnabled?: boolean;
    handwrittenEnabled?: boolean;
    officialDocumentEnabled?: boolean;
    livenessEnabled?: boolean;
}

/**
 * Create a signer
 */
export async function createSigner(signerData: SignerData) {
    console.log(`[ClickSign] Creating signer: ${signerData.name} (${signerData.email})`);

    const response = await clicksignFetch('/signers', {
        method: 'POST',
        body: JSON.stringify({
            signer: {
                email: signerData.email,
                phone_number: signerData.phoneNumber,
                name: signerData.name,
                documentation: signerData.documentation,
                birthday: signerData.birthday,
                has_documentation: signerData.hasDocumentation ?? true,
                selfie_enabled: signerData.selfieEnabled ?? false,
                handwritten_enabled: signerData.handwrittenEnabled ?? false,
                official_document_enabled: signerData.officialDocumentEnabled ?? false,
                liveness_enabled: signerData.livenessEnabled ?? false,
            }
        }),
    });

    console.log('[ClickSign] Signer created:', response.signer?.key);
    return response.signer;
}

/**
 * Signature list item
 */
export interface SignatureListItem {
    key: string;     // Signer key
    signAs: 'sign' | 'approve' | 'party' | 'witness' | 'intervening' | 'receipt';
}

/**
 * Create signature list (links signers to document)
 */
export async function createSignatureList(
    documentKey: string,
    signers: SignatureListItem[]
) {
    console.log(`[ClickSign] Creating signature list for document ${documentKey}`);
    console.log(`[ClickSign] Signers:`, signers.map(s => s.key).join(', '));

    const response = await clicksignFetch('/lists', {
        method: 'POST',
        body: JSON.stringify({
            list: {
                document_key: documentKey,
                signers: signers.map(s => ({
                    key: s.key,
                    sign_as: s.signAs
                }))
            }
        }),
    });

    console.log('[ClickSign] Signature list created:', response.list?.key);
    return response.list;
}

/**
 * Get document details
 */
export async function getDocument(documentKey: string) {
    console.log(`[ClickSign] Fetching document: ${documentKey}`);

    const response = await clicksignFetch(`/documents/${documentKey}`, {
        method: 'GET',
    });

    return response.document;
}

/**
 * Cancel document
 */
export async function cancelDocument(documentKey: string) {
    console.log(`[ClickSign] Canceling document: ${documentKey}`);

    const response = await clicksignFetch(`/documents/${documentKey}/cancel`, {
        method: 'PATCH',
    });

    return response.document;
}

/**
 * Get signer by key
 */
export async function getSigner(signerKey: string) {
    console.log(`[ClickSign] Fetching signer: ${signerKey}`);

    const response = await clicksignFetch(`/signers/${signerKey}`, {
        method: 'GET',
    });

    return response.signer;
}
