import { z } from 'zod';

// Validação de CPF (simples - apenas formato)
const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
const cpfSimpleRegex = /^\d{11}$/;

// Validação de CNPJ (simples - apenas formato)
const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
const cnpjSimpleRegex = /^\d{14}$/;

// Validação de telefone brasileiro
const phoneRegex = /^\(\d{2}\)\s?\d{4,5}-?\d{4}$/;

/**
 * Schema de validação para formulário de Nova Empresa
 */
export const companySchema = z.object({
    nome: z.string()
        .min(3, 'Nome deve ter no mínimo 3 caracteres')
        .max(200, 'Nome muito longo'),

    tipo: z.enum(['pf', 'pf-casado', 'pj', 'CUSTOMER', 'PARTNER', 'COMPETITOR'], {
        errorMap: () => ({ message: 'Selecione um tipo válido' })
    }),

    cpfCnpj: z.string()
        .min(11, 'CPF/CNPJ inválido')
        .refine((val) => {
            const cleaned = val.replace(/\D/g, '');
            // CPF tem 11 dígitos, CNPJ tem 14
            return cleaned.length === 11 || cleaned.length === 14;
        }, 'CPF/CNPJ inválido - deve conter 11 ou 14 dígitos'),

    email: z.string()
        .email('Email inválido')
        .toLowerCase(),

    telefone: z.string()
        .refine((val) => {
            const cleaned = val.replace(/\D/g, '');
            return cleaned.length >= 10 && cleaned.length <= 11;
        }, 'Telefone inválido (deve ter 10 ou 11 dígitos)')
});

/**
 * Schema de validação para formulário de Novo Imóvel
 */
export const propertySchema = z.object({
    endereco: z.string()
        .min(10, 'Endereço deve ter no mínimo 10 caracteres')
        .max(500, 'Endereço muito longo'),

    valor: z.string()
        .refine((val) => {
            const num = parseFloat(val);
            return !isNaN(num) && num > 0;
        }, 'Valor deve ser maior que zero'),

    matricula: z.string().optional(),

    administradora: z.string().optional(),

    valorCondominio: z.string().optional(),

    chamadaCapital: z.string().optional(),

    numeroParcelas: z.string().optional(),

    descricao: z.string().max(1000, 'Descrição muito longa').optional()
});

/**
 * Schema de validação para formulário de Nova Autorização (básico)
 * Pode ser expandido conforme necessário
 */
export const authorizationSchema = z.object({
    authType: z.enum(['pf', 'pf-casado', 'pj'], {
        errorMap: () => ({ message: 'Selecione o tipo de autorização' })
    }),

    contratante: z.object({
        nome: z.string().min(3, 'Nome muito curto'),
        cpfCnpj: z.string()
            .min(11, 'CPF/CNPJ inválido')
            .refine((val) => {
                const cleaned = val.replace(/\D/g, '');
                return cleaned.length === 11 || cleaned.length === 14;
            }, 'CPF/CNPJ deve conter 11 ou 14 dígitos'),
        telefone: z.string().min(10, 'Telefone inválido'),
        email: z.string().email('Email inválido'),
        estadoCivil: z.string().min(1, 'Selecione o estado civil'),
        regimeCasamento: z.string().optional(),
        profissao: z.string().optional()
    }),

    imovel: z.object({
        endereco: z.string().min(10, 'Endereço muito curto'),
        valor: z.string().refine((val) => {
            const num = parseFloat(val);
            return !isNaN(num) && num > 0;
        }, 'Valor inválido'),
        matricula: z.string().optional(),
        descricao: z.string().optional()
    })
});

// Tipos inferidos dos schemas
export type CompanyFormData = z.infer<typeof companySchema>;
export type PropertyFormData = z.infer<typeof propertySchema>;
export type AuthorizationFormData = z.infer<typeof authorizationSchema>;
