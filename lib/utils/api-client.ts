/**
 * Cliente de API para requisições ao backend com tokens seguros
 * Injeta automaticamente accessToken e domain nos headers
 */

import { useBitrix24 } from '@/lib/bitrix/client-sdk';

export interface ApiClientOptions extends RequestInit {
    accessToken?: string;
    domain?: string;
}

/**
 * Wrapper de fetch que coloca tokens em headers ao invés de query params
 */
export async function apiClient(
    url: string,
    options: ApiClientOptions = {}
): Promise<Response> {
    const { accessToken, domain, headers: customHeaders, ...restOptions } = options;

    // Prepara headers com tokens
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(customHeaders as Record<string, string>),
    };

    // Adiciona tokens aos headers se fornecidos
    if (accessToken) {
        headers['X-Bitrix-Token'] = accessToken;
    }

    if (domain) {
        headers['X-Bitrix-Domain'] = domain;
    }

    // Executa fetch com headers seguros
    return fetch(url, {
        ...restOptions,
        headers,
    });
}

/**
 * Hook customizado para uso com contexto Bitrix24
 * Automaticamente injeta tokens do contexto
 */
export function useApiClient() {
    const bitrix = useBitrix24();

    const client = async (
        url: string,
        options: Omit<ApiClientOptions, 'accessToken' | 'domain'> = {}
    ): Promise<Response> => {
        return apiClient(url, {
            ...options,
            accessToken: bitrix.authId || '',
            domain: bitrix.domain || '',
        });
    };

    return { client, bitrix };
}
