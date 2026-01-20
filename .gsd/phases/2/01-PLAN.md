---
phase: 2
plan: 1
wave: 1
depends_on: []
files_modified:
  - lib/test-utils/supabase-mock.ts
  - lib/test-utils/auth-helpers.ts
  - lib/test-utils/api-helpers.ts
autonomous: true
user_setup: []

must_haves:
  truths:
    - "Supabase client can be mocked for testing"
    - "Authentication headers can be created for test requests"
    - "Test data factories produce valid data"
  artifacts:
    - "lib/test-utils/supabase-mock.ts exports createMockSupabaseClient"
    - "lib/test-utils/auth-helpers.ts exports authentication utilities"
    - "lib/test-utils/api-helpers.ts exports API test helpers"
---

# Plan 2.1: Test Utilities & Mocking Infrastructure

<objective>
Create reusable test utilities for API route testing with Supabase mocking and authentication helpers.

**Purpose:** Establish foundation for all API integration tests. These utilities will be used by Plans 2.2-2.6 to create fast, isolated tests without hitting real external services.

**Output:**
- Supabase client mock factory
- Authentication test helpers
- API request builders and assertion helpers
- Test data factories
</objective>

<context>
Load for context:
- app/api/__tests__/health.test.ts (existing test pattern)
- lib/supabase/client.ts (Supabase client structure)
- lib/supabase/server.ts (Server client with RLS)
- types/database.ts (Database types)
</context>

<tasks>

<task type="auto">
  <name>Create Supabase mock utilities</name>
  <files>lib/test-utils/supabase-mock.ts</files>
  <action>
    Create a flexible Supabase client mock for testing:
    
    ```typescript
    import { SupabaseClient } from '@supabase/supabase-js'
    
    export interface MockQueryBuilder {
      select: jest.Mock
      insert: jest.Mock
      update: jest.Mock
      delete: jest.Mock
      eq: jest.Mock
      single: jest.Mock
      data: any
      error: any
    }
    
    export function createMockSupabaseClient(options?: {
      queryResponse?: any
      queryError?: any
      userId?: string
    }): Partial<SupabaseClient> {
      const mockQueryBuilder: MockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: options?.queryResponse ?? null,
          error: options?.queryError ?? null
        }),
        data: options?.queryResponse ?? null,
        error: options?.queryError ?? null
      }
      
      return {
        from: jest.fn().mockReturnValue(mockQueryBuilder),
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: options?.userId ? { id: options.userId } : null },
            error: null
          })
        }
      } as any
    }
    
    export function createMockQueryBuilder(data: any, error: any = null) {
      // Helper to create isolated query builders
    }
    ```
    
    Support chainable methods (select, eq, single) that match Supabase API patterns.
    
    AVOID: Creating complete Supabase implementation - only mock methods used in app
    AVOID: Using real Supabase client - tests should be fully isolated
  </action>
  <verify>npm test -- lib/test-utils/supabase-mock.test.ts (create simple test verifying mock works)</verify>
  <done>Supabase mock factory created with chainable query builder methods</done>
</task>

<task type="auto">
  <name>Create authentication test helpers</name>
  <files>lib/test-utils/auth-helpers.ts</files>
  <action>
    Create utilities for mocking authentication in tests:
    
    ```typescript
    import { NextRequest } from 'next/server'
    
    export interface MockUser {
      id: string
      email: string
      name: string
      bitrix_user_id: string
      is_admin: boolean
    }
    
    export function createMockUser(overrides?: Partial<MockUser>): MockUser {
      return {
        id: 'test-user-123',
        email: 'test@example.com',
        name: 'Test User',
        bitrix_user_id: 'B24_USER_1',
        is_admin: false,
        ...overrides
      }
    }
    
    export function createMockSession(user: MockUser) {
      return {
        user,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }
    }
    
    export function createMockSessionCookie(user: MockUser): string {
      const session = createMockSession(user)
      return `beehouse_session=${encodeURIComponent(JSON.stringify(session))}`
    }
    
    export function mockAuthenticatedRequest(
      url: string,
      options?: RequestInit & { user?: MockUser }
    ): NextRequest {
      const user = options?.user ?? createMockUser()
      const headers = new Headers(options?.headers)
      headers.set('cookie', createMockSessionCookie(user))
      
      return new NextRequest(url, {
        ...options,
        headers
      })
    }
    ```
    
    AVOID: Hardcoding session format - use same structure as middleware.ts
    AVOID: Real JWT tokens - use simple JSON session for tests
  </action>
  <verify>Import functions in test file, verify createMockUser returns valid user object</verify>
  <done>Authentication helpers created for mocking user sessions in tests</done>
</task>

<task type="auto">
  <name>Create API test helpers and data factories</name>
  <files>lib/test-utils/api-helpers.ts</files>
  <action>
    Create API testing utilities and test data factories:
    
    ```typescript
    import { NextRequest, NextResponse } from 'next/server'
    
    // Request builders
    export function createMockNextRequest(
      url: string,
      options?: {
        method?: string
        body?: any
        headers?: Record<string, string>
      }
    ): NextRequest {
      return new NextRequest(url, {
        method: options?.method ?? 'GET',
        headers: new Headers(options?.headers),
        body: options?.body ? JSON.stringify(options.body) : undefined
      })
    }
    
    // Response assertions
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
    
    // Test data factories
    export function createMockEmpresa(overrides?: Partial<any>) {
      return {
        id: 'empresa-123',
        empresa_type: 'PF',
        cpf: '12345678900',
        nome_completo: 'João da Silva',
        created_by_user_id: 'test-user-123',
        ...overrides
      }
    }
    
    export function createMockImovel(overrides?: Partial<any>) {
      return {
        id: 'imovel-123',
        empresa_id: 'empresa-123',
        endereco: 'Rua Teste, 123',
        city: 'São Paulo',
        state: 'SP',
        ...overrides
      }
    }
    
    export function createMockAutorizacao(overrides?: Partial<any>) {
      return {
        id: 'autorizacao-123',
        imovel_id: 'imovel-123',
        status: 'rascunho',
        exclusive: false,
        created_by_user_id: 'test-user-123',
        ...overrides
      }
    }
    ```
    
    AVOID: Complex test data - keep factories minimal with required fields only
    AVOID: Importing real database types if they add complexity - use plain objects
  </action>
  <verify>Import factories, verify they return valid-looking test data</verify>
  <done>API test helpers and data factories created for common test patterns</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] All test utilities export expected functions
- [ ] Mock Supabase client has chainable methods (from, select, eq, single)
- [ ] Auth helpers can create mock users and session cookies
- [ ] Data factories produce objects matching database schema
- [ ] No imports of real external services (Supabase, Bitrix24)
</verification>

<success_criteria>
- [ ] Test utilities are fully isolated (no real API calls)
- [ ] Utilities are reusable across all API test files
- [ ] Mock patterns match real Supabase client API
- [ ] Ready for Plans 2.2-2.6 to use these utilities
</success_criteria>
