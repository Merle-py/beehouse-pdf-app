import { kv } from '@vercel/kv';

/**
 * Cache Helper usando Vercel KV
 * Cache compartilhado entre todos os usuários
 */

const DEFAULT_TTL = 5 * 60; // 5 minutos em segundos

interface CacheOptions {
    ttl?: number; // Time to live em segundos
    tags?: string[]; // Tags para invalidação
}

/**
 * Busca dados do cache ou executa a função fetcher se não encontrar
 */
export async function getCachedData<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
): Promise<T> {
    const { ttl = DEFAULT_TTL } = options;

    try {
        // Tenta buscar do cache
        const cached = await kv.get<T>(key);

        if (cached !== null) {
            console.log(`[Cache HIT] ${key}`);
            return cached;
        }

        console.log(`[Cache MISS] ${key} - Buscando dados...`);
    } catch (error) {
        console.warn(`[Cache ERROR] Erro ao ler cache para ${key}:`, error);
        // Se der erro no cache, continua e busca os dados
    }

    // Cache miss ou erro - busca dados
    const data = await fetcher();

    // Salva no cache (fire and forget)
    try {
        await kv.set(key, data, { ex: ttl });
        console.log(`[Cache SET] ${key} (TTL: ${ttl}s)`);
    } catch (error) {
        console.warn(`[Cache ERROR] Erro ao salvar cache para ${key}:`, error);
        // Não falha se não conseguir salvar no cache
    }

    return data;
}

/**
 * Invalida cache por chave exata
 */
export async function invalidateCache(key: string): Promise<void> {
    try {
        await kv.del(key);
        console.log(`[Cache INVALIDATE] ${key}`);
    } catch (error) {
        console.warn(`[Cache ERROR] Erro ao invalidar ${key}:`, error);
    }
}

/**
 * Invalida múltiplas chaves por padrão
 * Exemplo: invalidateCachePattern('companies:*')
 */
export async function invalidateCachePattern(pattern: string): Promise<void> {
    try {
        // Vercel KV não tem SCAN, então precisamos manter lista de keys
        // Por enquanto, vamos apenas logar
        console.log(`[Cache INVALIDATE PATTERN] ${pattern} - Implementar lógica de pattern matching`);
    } catch (error) {
        console.warn(`[Cache ERROR] Erro ao invalidar pattern ${pattern}:`, error);
    }
}

/**
 * Gera chave de cache baseada em domínio e contexto
 */
export function generateCacheKey(domain: string, context: string, id?: string): string {
    const base = `${domain}:${context}`;
    return id ? `${base}:${id}` : base;
}
