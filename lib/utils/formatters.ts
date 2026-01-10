/**
 * Utilit\u00e1rios para formata\u00e7\u00e3o de inputs
 */

/**
 * Formata CPF: 000.000.000-00
 */
export function formatCPF(value: string): string {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
        return numbers
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return value;
}

/**
 * Formata CNPJ: 00.000.000/0000-00
 */
export function formatCNPJ(value: string): string {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 14) {
        return numbers
            .replace(/(\d{2})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1/$2')
            .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
    }
    return value;
}

/**
 * Formata CPF ou CNPJ automaticamente
 */
export function formatCPFOrCNPJ(value: string): string {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
        return formatCPF(value);
    }
    return formatCNPJ(value);
}

/**
 * Formata telefone: (00) 00000-0000 ou (00) 0000-0000
 */
export function formatPhone(value: string): string {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
        return numbers
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{4})(\d{1,4})$/, '$1-$2');
    }
    return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
}

/**
 * Formata valor monet\u00e1rio: R$ 0.000.000,00
 */
export function formatCurrency(value: string | number): string {
    const numValue = typeof value === 'string' ? parseFloat(value.replace(/\D/g, '')) / 100 : value;
    if (isNaN(numValue)) return 'R$ 0,00';

    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(numValue);
}

/**
 * Remove formata\u00e7\u00e3o de CPF/CNPJ
 */
export function unformatCPFOrCNPJ(value: string): string {
    return value.replace(/\D/g, '');
}

/**
 * Remove formata\u00e7\u00e3o de telefone
 */
export function unformatPhone(value: string): string {
    return value.replace(/\D/g, '');
}

/**
 * Remove formata\u00e7\u00e3o de moeda
 */
export function unformatCurrency(value: string): number {
    const numbers = value.replace(/\D/g, '');
    return parseFloat(numbers) / 100;
}

/**
 * Valida CPF (d\u00edgitos verificadores)
 */
export function validateCPF(cpf: string): boolean {
    const numbers = cpf.replace(/\D/g, '');

    if (numbers.length !== 11) return false;
    if (/^(\d)\1+$/.test(numbers)) return false; // Todos os d\u00edgitos iguais

    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(numbers.charAt(i)) * (10 - i);
    }
    let digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(numbers.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(numbers.charAt(i)) * (11 - i);
    }
    digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(numbers.charAt(10))) return false;

    return true;
}

/**
 * Valida CNPJ (d\u00edgitos verificadores)
 */
export function validateCNPJ(cnpj: string): boolean {
    const numbers = cnpj.replace(/\D/g, '');

    if (numbers.length !== 14) return false;
    if (/^(\d)\1+$/.test(numbers)) return false;

    let size = numbers.length - 2;
    let nums = numbers.substring(0, size);
    const digits = numbers.substring(size);
    let sum = 0;
    let pos = size - 7;

    for (let i = size; i >= 1; i--) {
        sum += parseInt(nums.charAt(size - i)) * pos--;
        if (pos < 2) pos = 9;
    }

    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) return false;

    size = size + 1;
    nums = numbers.substring(0, size);
    sum = 0;
    pos = size - 7;

    for (let i = size; i >= 1; i--) {
        sum += parseInt(nums.charAt(size - i)) * pos--;
        if (pos < 2) pos = 9;
    }

    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(1))) return false;

    return true;
}

/**
 * Valida CPF ou CNPJ
 */
export function validateCPFOrCNPJ(value: string): boolean {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length === 11) return validateCPF(value);
    if (numbers.length === 14) return validateCNPJ(value);
    return false;
}
