import { kv } from '@vercel/kv';
import axios from 'axios';

// Pega as chaves do ambiente da Vercel
const CLIENT_ID = process.env.B24_CLIENT_ID;
const CLIENT_SECRET = process.env.B24_CLIENT_SECRET;

/**
 * Salva os tokens no Vercel KV usando o member_id como chave.
 * @param {object} tokens - Objeto de tokens contendo member_id.
 */
export async function saveTokens(tokens) {
    if (!tokens || !tokens.member_id) {
        console.error('[saveTokens] Tentativa de salvar tokens sem member_id:', tokens);
        throw new Error('Member ID é obrigatório para salvar tokens.');
    }
    // Usa member_id como chave para suportar múltiplas instalações
    await kv.set(tokens.member_id, tokens);
    console.log(`[saveTokens] Tokens salvos para member_id: ${tokens.member_id}`);
}

/**
 * Carrega os tokens do Vercel KV usando o member_id.
 * @param {string} memberId - O ID do membro.
 * @returns {Promise<object|null>}
 */
export async function getTokens(memberId) {
    if (!memberId) {
        console.error('[getTokens] memberId não foi fornecido.');
        return null;
    }
    console.log(`[getTokens] Tentando recuperar tokens para member_id: ${memberId}`);
    const tokens = await kv.get(memberId);
    if (tokens) {
        console.log(`[getTokens] Tokens encontrados para member_id: ${memberId}`);
    } else {
        console.warn(`[getTokens] Nenhum token encontrado para member_id: ${memberId}`);
    }
    return tokens;
}

/**
 * Tenta obter tokens válidos, renovando se necessário.
 * Extrai member_id da requisição (body ou query).
 * @param {object} req - O objeto da requisição (Vercel).
 * @returns {Promise<object|null>} - Os tokens válidos ou null se falhar.
 */
export async function getFreshTokens(req) {
    // Extrai member_id (pode vir de locais diferentes)
    const memberId = req?.body?.member_id || req?.body?.auth?.member_id || req?.query?.member_id;
    if (!memberId) {
        console.error('[getFreshTokens] Não foi possível extrair member_id da requisição.');
        console.error('[getFreshTokens] Request Body:', req?.body);
        console.error('[getFreshTokens] Request Query:', req?.query);
        return null;
    }
    console.log(`[getFreshTokens] Tentando obter/renovar tokens para member_id: ${memberId}`);

    let tokens = await getTokens(memberId);
    if (!tokens) {
        console.error(`[getFreshTokens] Nenhum token inicial encontrado para member_id ${memberId}.`);
        return null; // Não há tokens para renovar
    }

    const now = Math.floor(Date.now() / 1000);
    console.log(`[getFreshTokens] Hora atual: ${now}, Token expira em: ${tokens.expires_in}`);

    // Verifica se o token expirou (expires_in DEVE ser um timestamp UNIX)
    if (tokens.expires_in && now > tokens.expires_in) {
        console.log(`[getFreshTokens] Token expirado para member_id ${memberId}. Tentando renovar...`);

        if (!tokens.refresh_token) {
            console.error(`[getFreshTokens] Falta refresh_token para member_id ${memberId}. Não é possível renovar.`);
            return null;
        }

        try {
            const refreshUrl = `https://${tokens.domain}/oauth/token/`; // Usa o domínio salvo
            const refreshParams = {
                grant_type: 'refresh_token',
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                refresh_token: tokens.refresh_token
            };
            console.log(`[getFreshTokens] Renovando token de: ${refreshUrl} com client_id: ${CLIENT_ID}`);

            // Usa GET para renovar, conforme documentação Bitrix24
            const refreshResponse = await axios.get(refreshUrl, { params: refreshParams });
            const refreshedData = refreshResponse.data;
            console.log(`[getFreshTokens] Renovação bem-sucedida para member_id ${memberId}.`);

            // Atualiza o objeto de tokens
            tokens = {
                ...tokens, // Mantém dados antigos (como member_id, domain)
                access_token: refreshedData.access_token,
                refresh_token: refreshedData.refresh_token || tokens.refresh_token, // Pega novo refresh_token se existir
                expires_in: Math.floor(Date.now() / 1000) + refreshedData.expires_in // Recalcula timestamp de expiração
            };

            await saveTokens(tokens); // Salva os tokens atualizados
            console.log(`[getFreshTokens] Tokens renovados salvos para member_id ${memberId}. Nova expiração: ${tokens.expires_in}`);

        } catch (refreshError) {
            console.error(`[getFreshTokens] Erro ao renovar token para member_id ${memberId}:`, refreshError.response ? JSON.stringify(refreshError.response.data) : refreshError.message);
            return null; // Retorna null indicando falha
        }
    } else if (!tokens.expires_in) {
        console.warn(`[getFreshTokens] Token para member_id ${memberId} não possui 'expires_in'. Assumindo como válido.`);
    } else {
        console.log(`[getFreshTokens] Token existente ainda é válido para member_id ${memberId}.`);
    }

    return tokens;
}

/**
 * Faz uma chamada à API REST Bitrix24.
 * @param {string} method - Método da API (ex: 'crm.company.get')
 * @param {object} params - Parâmetros da chamada (enviados no corpo do POST)
 * @param {object} authTokens - Objeto de tokens (DEVE conter access_token e domain)
 * @returns {Promise<object>} - A propriedade 'result' da resposta da API
 */
export async function call(method, params = {}, authTokens) {
    if (!authTokens || !authTokens.access_token || !authTokens.domain) {
        console.error('[call] Chamada de API tentada sem authTokens válidos (access_token/domain ausentes).');
        throw new Error('Tokens de autenticação incompletos ou ausentes.');
    }

    const { access_token, domain } = authTokens;
    
    // URL construída com crases (`)
    const url = `https://${domain}/rest/${method}`; 

    try {
        console.log(`[call] Chamando API: ${method} em ${domain}`);
        
        const response = await axios.post(url, params, {
            params: { auth: access_token } // Token como query parameter
        });

        console.log(`[call] Chamada API bem-sucedida: ${method}`);

        if (response.data && response.data.error) {
            console.error(`[call] Erro da API Bitrix24 (${method}):`, response.data.error_description);
            const apiError = new Error(response.data.error_description || response.data.error);
            apiError.details = { code: response.data.error };
            throw apiError;
        }

        return response.data?.result;

    } catch (error) {
        if (error.details?.code) {
            throw error; // Relança erro da API Bitrix
        }

        console.error(`[call] Erro de Axios/Rede (${method}). Status: ${error.response?.status}`);
        if (error.code === 'ENOTFOUND') {
           console.error(`[call] FALHA DE DNS para host: ${error.hostname || domain}.`);
           error.message = `Falha de DNS para ${error.hostname || domain} (getaddrinfo ENOTFOUND)`;
        } else if (error.response) {
           console.error('[call] Resposta de Erro Axios:', JSON.stringify(error.response.data));
        } else {
           console.error('[call] Erro de Rede/Timeout:', error.message);
        }

        const errorMessage = error.response?.data?.error_description || error.message || 'Erro desconhecido de rede/axios';
        const enhancedError = new Error(`Erro na chamada da API (${method}): ${errorMessage}`);
        enhancedError.details = error.response?.data || { code: error.code };
        enhancedError.status = error.response?.status;
        throw enhancedError;
    }
}

