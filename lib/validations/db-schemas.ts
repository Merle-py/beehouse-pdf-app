import { z } from 'zod';

// ============================================
// Authentication Schemas
// ============================================

export const registerSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
    name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
    role: z.enum(['admin', 'broker']).optional().default('broker'),
});

export const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(1, 'Senha é obrigatória'),
});

// ============================================
// Empresa Schemas (Database)
// ============================================

const empresaPFSchema = z.object({
    tipo: z.literal('PF'),
    nome: z.string().min(3, 'Nome completo é obrigatório'),
    cpf: z.string().min(11, 'CPF é obrigatório'),
    rg: z.string().optional(),
    profissao: z.string().optional(),
    estado_civil: z.string().optional(),
    regime_casamento: z.string().optional(),
    endereco: z.string().optional(),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    telefone: z.string().optional(),

    // Cônjuge
    conjuge_nome: z.string().optional(),
    conjuge_cpf: z.string().optional(),
    conjuge_rg: z.string().optional(),
    conjuge_profissao: z.string().optional(),
    conjuge_email: z.string().email('Email do cônjuge inválido').optional().or(z.literal('')),
});

const empresaPJSchema = z.object({
    tipo: z.literal('PJ'),
    razao_social: z.string().min(3, 'Razão social é obrigatória'),
    cnpj: z.string().min(14, 'CNPJ é obrigatório'),
    inscricao_estadual: z.string().optional(),
    inscricao_municipal: z.string().optional(),
    endereco_sede: z.string().optional(),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    telefone: z.string().optional(),

    // Representante Legal
    rep_legal_nome: z.string().optional(),
    rep_legal_cpf: z.string().optional(),
    rep_legal_cargo: z.string().optional(),
});

export const empresaCreateSchema = z.discriminatedUnion('tipo', [
    empresaPFSchema,
    empresaPJSchema,
]);

// For updates, we need to manually create a partial version since .partial() doesn't work on discriminated unions
export const empresaUpdateSchema = z.object({
    tipo: z.enum(['PF', 'PJ']).optional(),
    // PF fields
    nome: z.string().min(3).optional(),
    cpf: z.string().min(11).optional(),
    rg: z.string().optional(),
    profissao: z.string().optional(),
    estado_civil: z.string().optional(),
    regime_casamento: z.string().optional(),
    endereco: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    telefone: z.string().optional(),
    conjuge_nome: z.string().optional(),
    conjuge_cpf: z.string().optional(),
    conjuge_rg: z.string().optional(),
    conjuge_profissao: z.string().optional(),
    conjuge_email: z.string().email().optional().or(z.literal('')),
    // PJ fields
    razao_social: z.string().min(3).optional(),
    cnpj: z.string().min(14).optional(),
    inscricao_estadual: z.string().optional(),
    inscricao_municipal: z.string().optional(),
    endereco_sede: z.string().optional(),
    rep_legal_nome: z.string().optional(),
    rep_legal_cpf: z.string().optional(),
    rep_legal_cargo: z.string().optional(),
});

// ============================================
// Imóvel Schema (Database)
// ============================================

export const imovelCreateSchema = z.object({
    empresa_id: z.number().int().positive('ID da empresa é obrigatório'),
    descricao: z.string().min(5, 'Descrição deve ter no mínimo 5 caracteres'),
    endereco: z.string().min(5, 'Endereço é obrigatório'),
    matricula: z.string().optional(),
    valor: z.number().positive('Valor deve ser maior que zero'),
    admin_condominio: z.string().optional(),
    valor_condominio: z.number().nonnegative().optional(),
    chamada_capital: z.string().optional(),
    num_parcelas: z.number().int().nonnegative().optional(),
});

export const imovelUpdateSchema = imovelCreateSchema.partial().omit({ empresa_id: true });

// ============================================
// Autorização de Venda Schema (Database)
// ============================================

export const autorizacaoCreateSchema = z.object({
    imovel_id: z.number().int().positive('ID do imóvel é obrigatório'),
    prazo_exclusividade: z.number().int().min(0, 'Prazo não pode ser negativo').default(0),
    comissao_percentual: z.number().min(0).max(100, 'Comissão deve estar entre 0 e 100%').default(6.00),
});

export const autorizacaoUpdateSchema = z.object({
    prazo_exclusividade: z.number().int().min(0).optional(),
    comissao_percentual: z.number().min(0).max(100).optional(),
    status: z.enum(['rascunho', 'aguardando_assinatura', 'assinado', 'cancelado', 'encerrado']).optional(),
    clicksign_document_key: z.string().optional(),
    clicksign_status: z.string().optional(),
    clicksign_request_signature_key: z.string().optional(),
    pdf_url: z.string().optional(),
    pdf_filename: z.string().optional(),
    signed_at: z.string().datetime().optional(),
    expires_at: z.string().datetime().optional(),
});
