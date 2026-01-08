import type { BitrixField, BitrixCompanyType } from '@/types/company';

/**
 * Extrai valor de campo do Bitrix24 que pode ser array de objetos, array simples ou string
 * Centraliza lógica duplicada em múltiplos lugares do código
 * 
 * @param field - Campo do Bitrix24 (EMAIL, PHONE, etc)
 * @returns String com o valor extraído ou string vazia
 * 
 * @example
 * const email = extractBitrixField(company.EMAIL);
 * // Funciona com: [{VALUE: "test@example.com"}], ["test@example.com"], "test@example.com"
 */
export function extractBitrixField(field: BitrixField[] | string | undefined): string {
    if (!field) return '';

    // Se é array
    if (Array.isArray(field)) {
        const firstItem = field[0];

        // Se o primeiro item é um objeto com VALUE
        if (firstItem && typeof firstItem === 'object' && 'VALUE' in firstItem) {
            return firstItem.VALUE || '';
        }

        // Se é array de strings
        return String(firstItem || '');
    }

    // Se é string direta
    return String(field);
}

/**
 * Mapeia tipo de empresa do Bitrix24 para tipo de autorização do sistema
 * 
 * @param companyType - Tipo da empresa no Bitrix24
 * @returns Tipo de autorização correspondente
 */
export function getAuthTypeFromCompanyType(companyType: BitrixCompanyType): string {
    const typeMap: Record<BitrixCompanyType, string> = {
        'CUSTOMER': 'pf',
        'PARTNER': 'pf-casado',
        'COMPETITOR': 'pj',
        'SUPPLIER': 'pj' // Sócios também mapeiam para PJ
    };
    return typeMap[companyType] || 'pf';
}

/**
 * Retorna label humanizado do tipo de empresa
 * 
 * @param companyType - Tipo da empresa no Bitrix24
 * @returns Label em português
 */
export function getCompanyTypeLabel(companyType: string): string {
    const labels: Record<string, string> = {
        'CUSTOMER': 'PF Solteiro',
        'PARTNER': 'PF Casado',
        'SUPPLIER': 'Sócios',
        'COMPETITOR': 'PJ'
    };
    return labels[companyType] || 'Outro';
}

/**
 * Retorna configuração de badge para tipo de empresa
 * Centraliza mapeamento de cores/variantes usado em múltiplas páginas
 * 
 * @param companyType - Tipo da empresa no Bitrix24
 * @returns Objeto com label e variant para o Badge component
 */
export function getCompanyTypeBadge(companyType: string): {
    label: string;
    variant: 'info' | 'success' | 'warning' | 'default'
} {
    const badges: Record<string, { label: string; variant: 'info' | 'success' | 'warning' | 'default' }> = {
        'CUSTOMER': { label: 'PF Solteiro', variant: 'info' },
        'PARTNER': { label: 'PF Casado', variant: 'success' },
        'SUPPLIER': { label: 'Sócios', variant: 'warning' },
        'COMPETITOR': { label: 'PJ', variant: 'default' }
    };
    return badges[companyType] || { label: 'Outro', variant: 'default' };
}

/**
 * Mapeia tipo de autorização do sistema para tipo de empresa no Bitrix24
 * 
 * @param authType - Tipo de autorização ('pf', 'pf-casado', 'pj')
 * @returns Tipo de empresa correspondente no Bitrix24
 */
export function getCompanyTypeFromAuthType(authType: string): BitrixCompanyType {
    const typeMap: Record<string, BitrixCompanyType> = {
        'pf': 'CUSTOMER',
        'pf-casado': 'PARTNER',
        'pj': 'COMPETITOR'
    };
    return typeMap[authType] || 'CUSTOMER';
}
