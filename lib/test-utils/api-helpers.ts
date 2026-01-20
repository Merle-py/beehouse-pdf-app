/**
 * API test helpers and test data factories
 * Utilities for creating mock requests, responses, and test data
 */

import { NextRequest, NextResponse } from 'next/server'

/**
 * Creates a mock NextRequest for testing
 * 
 * @example
 * const req = createMockNextRequest('http://localhost/api/test', {
 *   method: 'POST',
 *   body: { name: 'Test' }
 * })
 */
export function createMockNextRequest(
    url: string,
    options?: {
        method?: string
        body?: any
        headers?: Record<string, string>
        searchParams?: Record<string, string>
    }
): NextRequest {
    const urlWithParams = options?.searchParams
        ? `${url}?${new URLSearchParams(options.searchParams).toString()}`
        : url

    return new NextRequest(urlWithParams, {
        method: options?.method ?? 'GET',
        headers: new Headers(options?.headers),
        body: options?.body ? JSON.stringify(options.body) : undefined
    })
}

/**
 * Asserts a JSON response and returns the parsed data
 * 
 * @example
 * const data = await expectJsonResponse(response, 200, { id: expect.any(String) })
 */
export async function expectJsonResponse(
    response: NextResponse,
    expectedStatus: number,
    expectedData?: any
) {
    expect(response.status).toBe(expectedStatus)
    const data = await response.json()
    if (expectedData) {
        expect(data).toMatchObject(expectedData)
    }
    return data
}

/**
 * Asserts an error response with specific message
 */
export async function expectErrorResponse(
    response: NextResponse,
    expectedStatus: number,
    expectedError?: string
) {
    expect(response.status).toBe(expectedStatus)
    const data = await response.json()
    expect(data).toHaveProperty('error')
    if (expectedError) {
        expect(data.error).toContain(expectedError)
    }
    return data
}

// ============================================================================
// Test Data Factories
// ============================================================================

/**
 * Creates mock Empresa (Company/Individual) data
 */
export function createMockEmpresa(overrides?: Partial<any>) {
    return {
        id: 'empresa-123',
        empresa_type: 'PF',
        cpf: '12345678900',
        nome_completo: 'João da Silva',
        email: 'joao@example.com',
        telefone: '11987654321',
        estado_civil: 'Solteiro',
        nacionalidade: 'Brasileiro',
        profissao: 'Empresário',
        created_by_user_id: 'test-user-123',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...overrides
    }
}

/**
 * Creates mock Empresa PJ (Legal Entity) data
 */
export function createMockEmpresaPJ(overrides?: Partial<any>) {
    return createMockEmpresa({
        empresa_type: 'PJ',
        cpf: undefined,
        cnpj: '12345678000190',
        razao_social: 'Empresa Teste LTDA',
        nome_completo: undefined,
        ...overrides
    })
}

/**
 * Creates mock Imóvel (Property) data
 */
export function createMockImovel(overrides?: Partial<any>) {
    return {
        id: 'imovel-123',
        empresa_id: 'empresa-123',
        endereco: 'Rua Teste, 123',
        complemento: 'Apto 45',
        bairro: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        cep: '01310-100',
        matricula: 'MAT-12345',
        cartorio: 'Cartório do 1º Ofício',
        created_by_user_id: 'test-user-123',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...overrides
    }
}

/**
 * Creates mock Autorização de Venda (Sales Authorization) data
 */
export function createMockAutorizacao(overrides?: Partial<any>) {
    return {
        id: 'autorizacao-123',
        imovel_id: 'imovel-123',
        status: 'rascunho',
        exclusive: false,
        sale_price: 500000.00,
        commission_percentage: 6.0,
        duration_days: 90,
        notes: 'Autorização de teste',
        pdf_url: null,
        pdf_filename: null,
        clicksign_document_key: null,
        signed_at: null,
        created_by_user_id: 'test-user-123',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...overrides
    }
}

/**
 * Creates a complete mock authorization with related empresa and imovel data
 * Matches the structure returned by vw_autorizacoes_completas
 */
export function createMockAutorizacaoCompleta(overrides?: any) {
    const empresa = createMockEmpresa(overrides?.empresa)
    const imovel = createMockImovel({
        empresa_id: empresa.id,
        ...overrides?.imovel
    })
    const autorizacao = createMockAutorizacao({
        imovel_id: imovel.id,
        ...overrides?.autorizacao
    })

    return {
        ...autorizacao,
        imovel,
        empresa
    }
}

/**
 * Creates mock Bitrix24 company data
 */
export function createMockBitrixCompany(overrides?: Partial<any>) {
    return {
        ID: '1',
        TITLE: 'Empresa Bitrix',
        COMPANY_TYPE: 'CUSTOMER',
        PHONE: [{ VALUE: '11987654321' }],
        EMAIL: [{ VALUE: 'empresa@bitrix.com' }],
        ...overrides
    }
}

/**
 * Creates mock Bitrix24 property (SPA item) data
 */
export function createMockBitrixProperty(overrides?: Partial<any>) {
    return {
        ID: '1',
        TITLE: 'Imóvel Bitrix',
        created: new Date().toISOString(),
        ...overrides
    }
}
