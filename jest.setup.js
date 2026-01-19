import '@testing-library/jest-dom'

// Polyfill for Next.js server runtime globals (Request, Response, Headers)
// Required for testing API routes
global.Request = Request
global.Response = Response
global.Headers = Headers

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
