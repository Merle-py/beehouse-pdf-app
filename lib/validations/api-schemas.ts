/**
 * Schemas de validação Zod para APIs
 */

import { z } from 'zod';

// ============================================
// Company Schemas
// ============================================

export const companyFormDataSchema = z.object({
    nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
    tipo: z.enum(['pf', 'pf-casado', 'pj', 'CUSTOMER', 'PARTNER', 'COMPETITOR']),
    cpfCnpj: z.string().min(11, 'CPF/CNPJ inválido'),
    email: z.string().email('Email inválido'),
    telefone: z.string().min(10, 'Telefone inválido'),
    accessToken: z.string().optional(), // Para retrocompatibilidade
    domain: z.string().optional(), // Para retrocompatibilidade
});

export type CompanyFormData = z.infer<typeof companyFormDataSchema>;

// ============================================
// Property Schemas
// ============================================

export const propertyFormDataSchema = z.object({
    endereco: z.string().min(10, 'Endereço deve ter pelo menos 10 caracteres'),
    valor: z.union([z.string(), z.number()]).transform(val => {
        const num = typeof val === 'string' ? parseFloat(val) : val;
        if (isNaN(num) || num <= 0) throw new Error('Valor do imóvel inválido');
        return num;
    }),
    matricula: z.string().optional(),
    administradora: z.string().optional(),
    valorCondominio: z.union([z.string(), z.number()]).optional(),
    chamadaCapital: z.string().optional(),
    numeroParcelas: z.string().optional(),
    descricao: z.string().optional(),
    companyId: z.string(),
    accessToken: z.string().optional(),
    domain: z.string().optional(),
});

export type PropertyFormData = z.infer<typeof propertyFormDataSchema>;

// ============================================
// Authorization Schemas
// ============================================

const personDataSchema = z.object({
    nome: z.string().optional(),
    cpf: z.string().optional(),
    profissao: z.string().optional(),
    estadoCivil: z.string().optional(),
    regimeCasamento: z.string().optional(),
    endereco: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    telefone: z.string().optional(),
});

const spouseDataSchema = z.object({
    nome: z.string().optional(),
    cpf: z.string().optional(),
    profissao: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
});

const propertyDataSchema = z.object({
    descricao: z.string(),
    endereco: z.string(),
    valor: z.number(),
    matricula: z.string().optional(),
    adminCondominio: z.string().optional(),
    valorCondominio: z.number().optional(),
    chamadaCapital: z.string().optional(),
    numParcelas: z.string().optional(),
});

const contractDataSchema = z.object({
    prazo: z.number().positive(),
    comissaoPct: z.number().min(0).max(100),
});

export const authorizationFormDataSchema = z.object({
    authType: z.enum(['pf', 'pf-casado', 'pj', 'pf-solteiro', 'socios']),
    contratante: personDataSchema.optional(),
    conjuge: spouseDataSchema.optional(),
    socios: z.array(personDataSchema).optional(),
    imovel: propertyDataSchema,
    contrato: contractDataSchema,
    accessToken: z.string().optional(),
    domain: z.string().optional(),
});

export type AuthorizationFormData = z.infer<typeof authorizationFormDataSchema>;
