/**
 * Supabase client mock utilities for testing
 * Provides flexible mocking of Supabase client without real database connections
 */

import { SupabaseClient } from '@supabase/supabase-js'

export interface MockQueryBuilder {
    select: jest.Mock
    insert: jest.Mock
    update: jest.Mock
    delete: jest.Mock
    eq: jest.Mock
    single: jest.Mock
    maybeSingle: jest.Mock
    limit: jest.Mock
    order: jest.Mock
    data: any
    error: any
}

export interface MockSupabaseClientOptions {
    queryResponse?: any
    queryError?: any
    userId?: string
}

/**
 * Creates a mock Supabase client for testing
 * 
 * @example
 * const mockClient = createMockSupabaseClient({
 *   queryResponse: { id: '123', name: 'Test' }
 * })
 * 
 * // Use in tests
 * jest.mock('@/lib/supabase/server', () => ({
 *   createServerClient: () => mockClient
 * }))
 */
export function createMockSupabaseClient(
    options: MockSupabaseClientOptions = {}
): Partial<SupabaseClient> {
    const mockQueryBuilder = createMockQueryBuilder(
        options.queryResponse,
        options.queryError
    )

    return {
        from: jest.fn().mockReturnValue(mockQueryBuilder),
        auth: {
            getUser: jest.fn().mockResolvedValue({
                data: {
                    user: options.userId ? { id: options.userId } : null
                },
                error: null
            })
        },
        storage: {
            from: jest.fn().mockReturnValue({
                upload: jest.fn().mockResolvedValue({ data: { path: 'test.pdf' }, error: null }),
                getPublicUrl: jest.fn().mockReturnValue({
                    data: { publicUrl: 'https://example.com/test.pdf' }
                })
            })
        }
    } as any
}

/**
 * Creates a mock query builder with chainable methods
 * 
 * @param data - Data to return from query
 * @param error - Error to return from query
 */
export function createMockQueryBuilder(
    data: any = null,
    error: any = null
): MockQueryBuilder {
    const builder: MockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data, error }),
        maybeSingle: jest.fn().mockResolvedValue({ data, error }),
        limit: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        data,
        error
    }

    // Make methods return resolved value for await
    builder.select.mockResolvedValue({ data, error })
    builder.insert.mockResolvedValue({ data, error })
    builder.update.mockResolvedValue({ data, error })
    builder.delete.mockResolvedValue({ data, error })

    return builder
}

/**
 * Creates a mock query builder that returns an array of data
 * Useful for list queries that return multiple rows
 */
export function createMockQueryBuilderWithArray(
    dataArray: any[] = [],
    error: any = null
): MockQueryBuilder {
    const builder = createMockQueryBuilder(dataArray, error)

    // Override single() to return first item
    builder.single.mockResolvedValue({
        data: dataArray.length > 0 ? dataArray[0] : null,
        error
    })

    return builder
}
