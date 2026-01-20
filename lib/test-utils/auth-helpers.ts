/**
 * Authentication test helpers
 * Utilities for mocking user sessions and authentication in tests
 */

import { NextRequest } from 'next/server'

export interface MockUser {
    id: string
    email: string
    name: string
    bitrix_user_id: string
    is_admin: boolean
    created_at?: string
    updated_at?: string
}

/**
 * Creates a mock user object for testing
 * 
 * @example
 * const user = createMockUser({ is_admin: true })
 * const req = mockAuthenticatedRequest('http://localhost/api/test', { user })
 */
export function createMockUser(overrides?: Partial<MockUser>): MockUser {
    return {
        id: 'test-user-123',
        email: 'test@beehouse.com',
        name: 'Test User',
        bitrix_user_id: 'B24_USER_1',
        is_admin: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...overrides
    }
}

/**
 * Creates a mock admin user
 */
export function createMockAdminUser(overrides?: Partial<MockUser>): MockUser {
    return createMockUser({
        id: 'admin-user-123',
        email: 'admin@beehouse.com',
        name: 'Admin User',
        bitrix_user_id: 'B24_ADMIN_1',
        is_admin: true,
        ...overrides
    })
}

/**
 * Creates a mock session object
 */
export function createMockSession(user: MockUser) {
    return {
        user,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }
}

/**
 * Creates a session cookie string for testing
 * Matches the format used in middleware.ts
 */
export function createMockSessionCookie(user: MockUser): string {
    const session = createMockSession(user)
    return `beehouse_session=${encodeURIComponent(JSON.stringify(session))}`
}

/**
 * Creates a mock NextRequest with authentication
 * 
 * @example
 * const req = mockAuthenticatedRequest('http://localhost/api/empresas')
 * const adminReq = mockAuthenticatedRequest('http://localhost/api/admin', {
 *   user: createMockAdminUser()
 * })
 */
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

/**
 * Creates an unauthenticated request (no session cookie)
 */
export function mockUnauthenticatedRequest(
    url: string,
    options?: RequestInit
): NextRequest {
    return new NextRequest(url, options)
}
