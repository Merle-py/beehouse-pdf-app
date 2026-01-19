---
phase: 1
plan: 2
wave: 1
depends_on: ["1.1"]
files_modified:
  - lib/utils/__tests__/formatters.test.ts
  - app/api/__tests__/health.test.ts
  - app/api/health/route.ts
autonomous: true
user_setup: []

must_haves:
  truths:
    - "Unit tests can test utility functions in isolation"
    - "Integration tests can test API routes with mocked Supabase"
    - "npm test executes and shows passing tests"
  artifacts:
    - "Example unit test exists and passes"
    - "Example integration test exists and passes"
    - "Test coverage report shows >0% coverage"
---

# Plan 1.2: Create Example Tests

<objective>
Write example unit and integration tests to prove the testing infrastructure works correctly and establish patterns for future test writing.

**Purpose:** Validate Jest configuration works with TypeScript, Next.js API routes, and provide reference implementations for the team.

**Output:**
- 1 unit test for a utility function
- 1 integration test for an API route
- Tests pass in npm test
- Coverage report generated
</objective>

<context>
Load for context:
- .gsd/phases/1/01-PLAN.md (Jest configuration)
- lib/utils/formatters.ts (utility functions to test)
- .gsd/ARCHITECTURE.md (API route structure)
- .gsd/STACK.md (Supabase usage)
</context>

<tasks>

<task type="auto">
  <name>Create unit test for utility formatter</name>
  <files>lib/utils/__tests__/formatters.test.ts</files>
  <action>
    Create a unit test file testing the formatCurrency function from lib/utils/formatters.ts:
    
    ```typescript
    import { formatCurrency } from '../formatters'
    
    describe('formatCurrency', () => {
      it('formats Brazilian currency correctly', () => {
        expect(formatCurrency(1000)).toBe('R$ 1.000,00')
        expect(formatCurrency(1234.56)).toBe('R$ 1.234,56')
        expect(formatCurrency(0)).toBe('R$ 0,00')
      })
      
      it('handles negative values', () => {
        expect(formatCurrency(-500)).toBe('-R$ 500,00')
      })
      
      it('handles decimal precision', () => {
        expect(formatCurrency(10.5)).toBe('R$ 10,50')
        expect(formatCurrency(10.999)).toBe('R$ 11,00') // rounds
      })
      
      it('handles null and undefined', () => {
        expect(formatCurrency(null)).toBe('R$ 0,00')
        expect(formatCurrency(undefined)).toBe('R$ 0,00')
      })
    })
    ```
    
    Create the __tests__ directory if it doesn't exist: lib/utils/__tests__/
    
    AVOID: Do NOT test actual API calls in unit tests - keep them pure.
    AVOID: Do NOT import Next.js components in unit tests for utilities - breaks isolation.
  </action>
  <verify>npm test -- formatters.test.ts shows all tests passing</verify>
  <done>Unit test file exists with 4 passing test cases for formatCurrency function</done>
</task>

<task type="auto">
  <name>Create simple health check API route</name>
  <files>app/api/health/route.ts</files>
  <action>
    Create a simple health check endpoint for testing purposes:
    
    ```typescript
    import { NextResponse } from 'next/server'
    
    export async function GET() {
      return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
      })
    }
    ```
    
    This provides a simple endpoint to test API route testing patterns without requiring database/authentication.
    
    AVOID: Do NOT add authentication to this route - it's for health checks.
  </action>
  <verify>curl http://localhost:3000/api/health returns {"status":"ok",...} in dev server</verify>
  <done>Health check API route exists and returns JSON response</done>
</task>

<task type="auto">
  <name>Create integration test for health API route</name>
  <files>app/api/__tests__/health.test.ts</files>
  <action>
    Create an integration test for the health check endpoint:
    
    ```typescript
    import { NextRequest } from 'next/server'
    import { GET } from '../health/route'
    
    describe('GET /api/health', () => {
      it('returns 200 with status ok', async () => {
        const req = new NextRequest('http://localhost:3000/api/health')
        const response = await GET()
        
        expect(response.status).toBe(200)
        
        const data = await response.json()
        expect(data.status).toBe('ok')
        expect(data.timestamp).toBeDefined()
        expect(data.environment).toBe('test')
      })
      
      it('returns timestamp in ISO format', async () => {
        const response = await GET()
        const data = await response.json()
        
        expect(data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
      })
    })
    ```
    
    Create the __tests__ directory: app/api/__tests__/
    
    Set NODE_ENV=test in jest.config.js environment if not already set.
    
    AVOID: Do NOT use fetch() to call the route - import and call directly for faster tests.
    AVOID: Do NOT test Supabase integration in this example - keep it simple.
  </action>
  <verify>npm test -- health.test.ts shows all tests passing</verify>
  <done>Integration test exists with 2 passing test cases for health API route</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] npm test shows at least 6 passing tests (4 unit + 2 integration)
- [ ] npm test:coverage shows >0% coverage
- [ ] Both unit and integration test patterns work
- [ ] Tests run in under 10 seconds
</verification>

<success_criteria>
- [ ] Example unit test demonstrates testing utility functions
- [ ] Example integration test demonstrates testing API routes
- [ ] All tests pass without warnings
- [ ] Coverage report generated successfully
</success_criteria>
