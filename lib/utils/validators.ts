/**
 * Utilitários de Validação e Máscaras de Input
 */

// ========== MÁSCARAS ==========

/**
 * Aplica máscara de CPF: 000.000.000-00
 */
export function maskCPF(value: string): string {
    return value
        .replace(/\D/g, '') // Remove tudo que não é dígito
        .replace(/(\d{3})(\d)/, '$1.$2') // Adiciona ponto após 3 dígitos
        .replace(/(\d{3})(\d)/, '$1.$2') // Adiciona ponto após 6 dígitos
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2') // Adiciona hífen antes dos 2 últimos
        .substring(0, 14); // Limita a 14 caracteres
}

/**
 * Aplica máscara de CNPJ: 00.000.000/0000-00
 */
export function maskCNPJ(value: string): string {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
        .substring(0, 18);
}

/**
 * Aplica máscara de Telefone: (00) 00000-0000 ou (00) 0000-0000
 */
export function maskPhone(value: string): string {
    const cleaned = value.replace(/\D/g, '');

    if (cleaned.length <= 10) {
        // Telefone fixo: (00) 0000-0000
        return cleaned
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{4})(\d)/, '$1-$2')
            .substring(0, 14);
    } else {
        // Celular: (00) 00000-0000
        return cleaned
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .substring(0, 15);
    }
}

/**
 * Aplica máscara inteligente de CPF/CNPJ baseado no comprimento
 * - Até 11 dígitos: aplica máscara de CPF (000.000.000-00)
 * - Mais de 11 dígitos: aplica máscara de CNPJ (00.000.000/0000-00)
 */
export function maskCPFCNPJ(value: string): string {
    const cleaned = value.replace(/\D/g, '').substring(0, 14); // Limita a 14 dígitos

    if (cleaned.length <= 11) {
        // Aplica máscara de CPF
        return cleaned
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
        // Aplica máscara de CNPJ
        return cleaned
            .replace(/(\d{2})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1/$2')
            .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
    }
}

/**
 * Aplica máscara de Valor: R$ 0.000,00
 */
export function maskCurrency(value: string | number): string {
    const numValue = typeof value === 'string' ? parseFloat(value.replace(/\D/g, '')) / 100 : value;

    if (isNaN(numValue)) return 'R$ 0,00';

    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(numValue);
}

/**
 * Remove máscara e retorna apenas números
 */
export function unmask(value: string): string {
    return value.replace(/\D/g, '');
}

// ========== VALIDAÇÕES ==========

/**
 * Valida CPF (verifica dígitos verificadores)
 */
export function validateCPF(cpf: string): boolean {
    const cleaned = unmask(cpf);

    if (cleaned.length !== 11) return false;

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cleaned)) return false;

    // Valida primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cleaned.charAt(i)) * (10 - i);
    }
    let digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cleaned.charAt(9))) return false;

    // Valida segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cleaned.charAt(i)) * (11 - i);
    }
    digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cleaned.charAt(10))) return false;

    return true;
}

/**
 * Valida CNPJ (verifica dígitos verificadores)
 */
export function validateCNPJ(cnpj: string): boolean {
    const cleaned = unmask(cnpj);

    if (cleaned.length !== 14) return false;

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{13}$/.test(cleaned)) return false;

    // Valida primeiro dígito verificador
    let sum = 0;
    let weight = 5;
    for (let i = 0; i < 12; i++) {
        sum += parseInt(cleaned.charAt(i)) * weight;
        weight = weight === 2 ? 9 : weight - 1;
    }
    let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (digit !== parseInt(cleaned.charAt(12))) return false;

    // Valida segundo dígito verificador
    sum = 0;
    weight = 6;
    for (let i = 0; i < 13; i++) {
        sum += parseInt(cleaned.charAt(i)) * weight;
        weight = weight === 2 ? 9 : weight - 1;
    }
    digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (digit !== parseInt(cleaned.charAt(13))) return false;

    return true;
}

/**
 * Valida Email (formato básico)
 */
export function validateEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Valida Telefone (formato brasileiro)
 */
export function validatePhone(phone: string): boolean {
    const cleaned = unmask(phone);
    return cleaned.length === 10 || cleaned.length === 11;
}

/**
 * Valida CPF ou CNPJ dinamicamente baseado no comprimento
 */
export function validateCPFCNPJ(value: string): boolean {
    const cleaned = unmask(value);

    if (cleaned.length === 11) {
        return validateCPF(value);
    } else if (cleaned.length === 14) {
        return validateCNPJ(value);
    }

    return false;
}

/**
 * Valida se valor é positivo
 */
export function validatePositiveNumber(value: number): boolean {
    return !isNaN(value) && value > 0;
}

// ========== HELPERS ==========

/**
 * Formata valor para exibição
 */
export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

/**
 * Parse de valor monetário (R$ 1.000,00 -> 1000)
 */
export function parseCurrency(value: string): number {
    return parseFloat(value.replace(/\D/g, '')) / 100;
}
