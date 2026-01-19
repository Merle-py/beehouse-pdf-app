---
phase: 1
plan: 1
wave: 1
depends_on: []
files_modified:
  - package.json
  - jest.config.js
  - jest.setup.js
  - .babelrc
autonomous: true
user_setup: []

must_haves:
  truths:
    - "Jest is installed and configured for Next.js 14"
    - "React Testing Library is available for component testing"
    - "npm test command executes successfully"
  artifacts:
    - "jest.config.js exists with Next.js preset"
    - "jest.setup.js configures test environment"
    - "package.json has test script"
---

# Plan 1.1: Install & Configure Testing Framework

<objective>
Install Jest and React Testing Library with proper Next.js 14 App Router configuration, enabling the foundation for all subsequent testing work.

**Purpose:** Establish testing infrastructure that works with TypeScript, Next.js App Router, and Server Components.

**Output:** 
- Jest + React Testing Library installed
- Configuration files for Next.js compatibility
- Test script in package.json
- Working test environment
</objective>

<context>
Load for context:
- .gsd/SPEC.md (testing requirements)
- .gsd/STACK.md (Next.js 14, TypeScript 5.3, React 18)
- package.json (current dependencies)
- tsconfig.json (TypeScript configuration)
- next.config.mjs (Next.js configuration)
</context>

<tasks>

<task type="auto">
  <name>Install Jest and React Testing Library dependencies</name>
  <files>package.json</files>
  <action>
    Install the following dev dependencies:
    - jest@^29.7.0
    - @testing-library/react@^14.1.2
    - @testing-library/jest-dom@^6.1.5
    - @testing-library/user-event@^14.5.1
    - jest-environment-jsdom@^29.7.0
    - @types/jest@^29.5.11
    
    Use npm install --save-dev with specific versions to ensure compatibility.
    
    Add "test" script to package.json scripts section:
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
    
    AVOID: Do NOT use create-react-app's test setup - it conflicts with Next.js.
    AVOID: Do NOT install incompatible versions (Jest 30+ has breaking changes)
  </action>
  <verify>npm list jest @testing-library/react shows installed packages</verify>
  <done>package.json contains all testing dependencies and test scripts</done>
</task>

<task type="auto">
  <name>Create Jest configuration for Next.js App Router</name>
  <files>jest.config.js, jest.setup.js</files>
  <action>
    Create jest.config.js in project root with Next.js-specific configuration:
    
    ```javascript
    const nextJest = require('next/jest')
    
    const createJestConfig = nextJest({
      dir: './',
    })
    
    const customJestConfig = {
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
      testEnvironment: 'jest-environment-jsdom',
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
      },
      testMatch: [
        '**/__tests__/**/*.(test|spec).(ts|tsx|js|jsx)',
        '**/*.(test|spec).(ts|tsx|js|jsx)'
      ],
      collectCoverageFrom: [
        'app/**/*.{js,jsx,ts,tsx}',
        'components/**/*.{js,jsx,ts,tsx}',
        'lib/**/*.{js,jsx,ts,tsx}',
        '!**/*.d.ts',
        '!**/node_modules/**',
        '!**/.next/**',
      ],
    }
    
    module.exports = createJestConfig(customJestConfig)
    ```
    
    Create jest.setup.js for test environment configuration:
    
    ```javascript
    import '@testing-library/jest-dom'
    
    // Mock Next.js router
    jest.mock('next/navigation', () => ({
      useRouter() {
        return {
          push: jest.fn(),
          replace: jest.fn(),
          prefetch: jest.fn(),
        }
      },
      useSearchParams() {
        return new URLSearchParams()
      },
      usePathname() {
        return ''
      },
    }))
    ```
    
    AVOID: Do NOT use old Next.js 12/13 Jest config patterns - App Router needs different setup.
    AVOID: Do NOT forget to mock next/navigation - tests will fail without it.
  </action>
  <verify>npm test shows Jest configured and ready (even if 0 tests found)</verify>
  <done>jest.config.js and jest.setup.js exist with proper Next.js 14 configuration</done>
</task>

<task type="auto">
  <name>Verify test environment setup</name>
  <files>N/A (verification only)</files>
  <action>
    Run the following commands to verify setup:
    
    1. npm test -- --version (should show Jest 29.x)
    2. npm test (should show "No tests found" but no errors)
    3. Check that TypeScript recognizes Jest types (no TS errors in jest.*.js files)
    
    If any errors occur:
    - Check Node.js version is 20.x (matches STACK.md)
    - Verify all dependencies installed correctly
    - Check for conflicting test libraries
    
    AVOID: Do NOT proceed if Jest gives configuration errors.
  </action>
  <verify>npm test executes without errors (OK to have 0 tests)</verify>
  <done>Jest runs successfully with proper Next.js configuration, ready for tests to be written</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] npm test runs without configuration errors
- [ ] Jest recognizes TypeScript files (.ts, .tsx)
- [ ] Next.js mocks are loaded (no import errors for next/navigation)
- [ ] Coverage collection configured for app/, components/, lib/
</verification>

<success_criteria>
- [ ] All dependencies installed successfully
- [ ] Jest configuration compatible with Next.js 14 App Router
- [ ] npm test command executes (even with 0 tests)
- [ ] Test environment ready for writing tests
</success_criteria>
