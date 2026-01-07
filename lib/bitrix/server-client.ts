import axios from 'axios';
import type { BitrixApiResponse, BitrixCompanyCreateData, BitrixPropertyItemData } from '@/types/authorization';

const ADMIN_WEBHOOK_URL = process.env.B24_ADMIN_WEBHOOK_URL || '';
const PROPERTY_ENTITY_TYPE_ID = parseInt(process.env.B24_PROPERTY_ENTITY_TYPE_ID || '0', 10);

/**
 * Valida se o webhook de administrador está configurado
 */
function validateWebhookConfig(): void {
    if (!ADMIN_WEBHOOK_URL) {
        throw new Error('B24_ADMIN_WEBHOOK_URL não configurado. Configure o webhook de administrador no .env.local');
    }
    if (!PROPERTY_ENTITY_TYPE_ID) {
        throw new Error('B24_PROPERTY_ENTITY_TYPE_ID não configurado. Configure o ID do SPA Imóveis no .env.local');
    }
}

/**
 * Faz uma chamada à API REST do Bitrix24 usando o Webhook de Administrador
 * @param method - Método da API (ex: 'crm.company.add')
 * @param params - Parâmetros da chamada
 */
export async function callBitrixAPI<T = any>(method: string, params: Record<string, any> = {}): Promise<T> {
    validateWebhookConfig();

    const url = `${ADMIN_WEBHOOK_URL}${method}`;

    try {
        console.log(`[Bitrix Server] Chamando: ${method}`, params);

        const response = await axios.post<BitrixApiResponse<T>>(url, params);

        if (response.data.error) {
            console.error(`[Bitrix Server] Erro na API: ${response.data.error_description}`);
            throw new Error(response.data.error_description || response.data.error);
        }

        console.log(`[Bitrix Server] Sucesso: ${method}`);
        return response.data.result as T;

    } catch (error: any) {
        console.error(`[Bitrix Server] Erro ao chamar ${method}:`, error.message);

        if (error.response?.data?.error_description) {
            throw new Error(`Erro Bitrix24: ${error.response.data.error_description}`);
        }

        throw new Error(`Erro na comunicação com Bitrix24: ${error.message}`);
    }
}

/**
 * Valida um access_token de usuário e retorna as informações do usuário autenticado
 * 
 * IMPORTANTE: user.current NÃO retorna IS_ADMIN!
 * Estratégia: 
 * 1. Valida token via user.current (obtém userId)
 * 2. Busca IS_ADMIN via user.get com webhook admin
 * 
 * @param accessToken - Token de acesso do usuário
 * @param domain - Domínio Bitrix24
 * @returns Informações do usuário autenticado (ID, nome, isAdmin)
 */
export async function validateUserToken(accessToken: string, domain: string): Promise<{
    userId: string;
    name: string;
    lastName: string;
    isAdmin: boolean;
}> {
    if (!accessToken || !domain) {
        throw new Error('Access token e domain são obrigatórios');
    }

    // Monta URL para chamar user.current usando o token do USUÁRIO
    const url = `https://${domain}/rest/user.current.json?auth=${accessToken}`;

    try {
        console.log('[Bitrix Server] Validando token do usuário...');

        // Passo 1: Valida token e obtém userId
        const response = await axios.get<BitrixApiResponse<any>>(url);

        if (response.data.error) {
            console.error('[Bitrix Server] Token inválido:', response.data.error_description);
            throw new Error('Token inválido ou expirado');
        }

        const user = response.data.result;
        const userId = user.ID;

        console.log('[Bitrix Server] Token validado - User ID:', userId);

        // Passo 2: Busca IS_ADMIN via webhook admin (user.get)
        console.log('[Bitrix Server] Buscando permissões de admin via webhook...');

        const users = await callBitrixAPI<any[]>('user.get', {
            ID: userId,
            ADMIN_MODE: true
        });

        const isAdmin = users && users.length > 0 && (users[0].IS_ADMIN === 'Y' || users[0].IS_ADMIN === true);

        console.log('[Bitrix Server] IS_ADMIN:', isAdmin);

        return {
            userId: userId,
            name: user.NAME || '',
            lastName: user.LAST_NAME || '',
            isAdmin
        };

    } catch (error: any) {
        console.error('[Bitrix Server] Erro ao validar token:', error.message);

        if (error.response?.status === 401) {
            throw new Error('Token inválido ou expirado');
        }

        throw new Error(`Erro na validação do token: ${error.message}`);
    }
}

/**
 * Cria uma Company no Bitrix24 (via webhook admin - bypass de permissões)
 * @param data - Dados da empresa
 * @returns ID da Company criada
 */
export async function createCompany(data: BitrixCompanyCreateData): Promise<number> {
    console.log('[Bitrix Server] Criando Company:', data.TITLE);

    const result = await callBitrixAPI<number>('crm.company.add', {
        fields: {
            TITLE: data.TITLE,
            PHONE: data.PHONE || [],
            EMAIL: data.EMAIL || [],
            COMMENTS: data.COMMENTS || '',
            OPENED: 'Y', // Visível para todos
        }
    });

    console.log('[Bitrix Server] Company criada com ID:', result);
    return result;
}

/**
 * Busca uma Company pelo ID
 */
export async function getCompany(companyId: number): Promise<any> {
    return await callBitrixAPI('crm.company.get', { id: companyId });
}

/**
 * Cria um Item no SPA "Imóveis" vinculado a uma Company
 * @param data - Dados do imóvel e companyId
 * @returns ID do Item criado
 */
export async function createPropertyItem(data: BitrixPropertyItemData): Promise<number> {
    console.log('[Bitrix Server] Criando Property Item:', data.title);

    const result = await callBitrixAPI<{ item: { id: number } }>('crm.item.add', {
        entityTypeId: data.entityTypeId || PROPERTY_ENTITY_TYPE_ID,
        fields: {
            TITLE: data.title,
            COMPANY_ID: data.companyId,
            ...data, // Campos customizados UF_CRM_*
        }
    });

    const itemId = result.item.id;
    console.log('[Bitrix Server] Property Item criado com ID:', itemId);
    return itemId;
}

/**
 * Busca um Item do SPA pelo ID
 */
export async function getPropertyItem(itemId: number): Promise<any> {
    return await callBitrixAPI('crm.item.get', {
        entityTypeId: PROPERTY_ENTITY_TYPE_ID,
        id: itemId
    });
}

/**
 * Faz upload de um arquivo para o Bitrix24
 * @param fileName - Nome do arquivo
 * @param fileBuffer - Buffer do arquivo
 * @returns ID do arquivo no Bitrix24
 */
export async function uploadFileToBitrix(fileName: string, fileBuffer: Buffer): Promise<number> {
    console.log('[Bitrix Server] Fazendo upload do arquivo:', fileName);

    // Converte o buffer para base64
    const base64Data = fileBuffer.toString('base64');

    const result = await callBitrixAPI<number>('disk.folder.uploadfile', {
        id: 'shared_files_s1', // Pasta compartilhada padrão (ajustar se necessário)
        data: {
            NAME: fileName
        },
        fileContent: base64Data
    });

    console.log('[Bitrix Server] Arquivo enviado com ID:', result);
    return result;
}

/**
 * Anexa um arquivo a um Item do CRM
 */
export async function attachFileToItem(itemId: number, fileId: number): Promise<void> {
    console.log('[Bitrix Server] Anexando arquivo', fileId, 'ao item', itemId);

    await callBitrixAPI('crm.item.update', {
        entityTypeId: PROPERTY_ENTITY_TYPE_ID,
        id: itemId,
        fields: {
            // Adiciona o arquivo aos campos do item (campo específico do seu SPA)
            UF_CRM_FILE: fileId
        }
    });

    console.log('[Bitrix Server] Arquivo anexado com sucesso');
}

/**
 * Busca empresas por termo de busca (para autocomplete)
 */
export async function searchCompanies(searchTerm: string): Promise<any[]> {
    const result = await callBitrixAPI<any[]>('crm.company.list', {
        filter: {
            '%TITLE': searchTerm
        },
        select: ['ID', 'TITLE', 'PHONE', 'EMAIL']
    });

    return result || [];
}
