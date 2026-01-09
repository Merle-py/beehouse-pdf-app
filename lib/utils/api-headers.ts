/**
 * Utilitário para extração segura de tokens e domain dos headers
 * usado nas APIs do backend
 */

import { NextRequest } from 'next/server';

export interface ApiCredentials {
    accessToken: string;
    domain: string;
}

/**
 * Extrai credenciais do Bitrix24 de forma segura
 * 
 * Ordem de prioridade:
 * 1. Headers HTTP (X-Bitrix-Token, X-Bitrix-Domain) - RECOMENDADO
 * 2. Body da requisição (accessToken, domain) - Para POST/PATCH
 * 3. Query params (accessToken, domain) - DEPRECATED
 * 
 * @param request - NextRequest object
 * @param body - Optional body object (para POST/PATCH)
 * @returns ApiCredentials ou null se não encontrado
 */
export function extractBitrixCredentials(
    request: NextRequest,
    body?: any
): ApiCredentials | null {
    // Prioridade 1: Headers (recomendado)
    let accessToken = request.headers.get('X-Bitrix-Token');
    let domain = request.headers.get('X-Bitrix-Domain');

    // Prioridade 2: Body (para POST/PATCH requests)
    if ((!accessToken || !domain) && body) {
        accessToken = accessToken || body.accessToken;
        domain = domain || body.domain;
    }

    // Prioridade 3: Query params (deprecated - com warning)
    if (!accessToken || !domain) {
        const { searchParams } = new URL(request.url);
        accessToken = accessToken || searchParams.get('accessToken');
        domain = domain || searchParams.get('domain');

        if ((accessToken || domain) && process.env.NODE_ENV === 'development') {
            console.warn(
                '[DEPRECATED] Usando tokens em query params. Migre para headers (X-Bitrix-Token, X-Bitrix-Domain)'
            );
        }
    }

    if (!accessToken || !domain) {
        return null;
    }

    return { accessToken, domain };
}

/**
 * Middleware helper para validar credenciais
 */
export function requireBitrixCredentials(request: NextRequest): ApiCredentials {
    const credentials = extractBitrixCredentials(request);

    if (!credentials) {
        throw new Error('Missing Bitrix24 credentials (accessToken and domain required)');
    }

    return credentials;
}
