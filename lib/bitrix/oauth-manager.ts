import { kv } from '@vercel/kv';

/**
 * Sistema de autenticação para aplicações locais Bitrix24
 * 
 * IMPORTANTE: Aplicações Locais no Bitrix24 NÃO usam CLIENT_ID/SECRET
 * O access_token é obtido automaticamente via SDK JS (BX24.getAuth())
 * 
 * Este módulo apenas armazena tokens temporariamente para chamadas server-side
 */

export interface OAuthTokens {
    member_id: string;
    access_token: string;
    refresh_token: string;
    expires_in: number; // Unix timestamp
    domain: string;
}

/**
 * Salva tokens OAuth do corretor no KV
 */
export async function saveUserTokens(tokens: OAuthTokens): Promise<void> {
    if (!tokens.member_id) {
        throw new Error('member_id é obrigatório');
    }

    try {
        await kv.set(`oauth:${tokens.member_id}`, tokens);
        console.log(`[OAuth] Tokens salvos para member_id: ${tokens.member_id}`);
    } catch (error: any) {
        console.error('[OAuth] Erro ao salvar tokens:', error);
        throw new Error(`Falha ao salvar tokens: ${error.message}`);
    }
}

/**
 * Carrega tokens OAuth do corretor
 */
export async function getUserTokens(memberId: string): Promise<OAuthTokens | null> {
    if (!memberId) {
        console.error('[OAuth] memberId não fornecido');
        return null;
    }

    try {
        const tokens = await kv.get<OAuthTokens>(`oauth:${memberId}`);
        if (tokens) {
            console.log(`[OAuth] Tokens encontrados para member_id: ${memberId}`);
        } else {
            console.warn(`[OAuth] Nenhum token para member_id: ${memberId}`);
        }
        return tokens;
    } catch (error: any) {
        console.error('[OAuth] Erro ao ler tokens:', error);
        return null;
    }
}

/**
 * Obtém tokens do corretor
 * 
 * Para aplicações locais Bitrix24, o frontend sempre envia token fresco do SDK
 * Não é necessário refresh manual com CLIENT_ID/SECRET
 */
export async function getFreshUserTokens(memberId: string): Promise<OAuthTokens | null> {
    const tokens = await getUserTokens(memberId);

    if (!tokens) {
        console.warn(`[OAuth] Nenhum token para member_id: ${memberId}`);
        return null;
    }

    // Para aplicações locais, o token vem sempre fresco do SDK JS
    // Não fazemos refresh server-side
    console.log(`[OAuth] Usando token para ${memberId}`);
    return tokens;
}

/**
 * Faz chamada à API Bitrix24 usando token do corretor
 * (para chamadas que NÃO exigem permissões especiais)
 */
export async function callAsUser(
    method: string,
    params: Record<string, any>,
    memberId: string
): Promise<any> {
    const tokens = await getFreshUserTokens(memberId);

    if (!tokens) {
        throw new Error('Tokens de autenticação não encontrados ou expirados');
    }

    const url = `https://${tokens.domain}/rest/${method}`;

    try {
        console.log(`[OAuth] Chamando ${method} como usuário ${memberId}`);

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...params, auth: tokens.access_token })
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error_description || data.error);
        }

        return data.result;
    } catch (error: any) {
        console.error(`[OAuth] Erro na chamada ${method}:`, error);
        throw error;
    }
}
