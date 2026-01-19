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
    testTimeout: 10000, // Increase timeout for CI
    ...(process.env.CI && { maxWorkers: 2 }), // Limit workers in CI only
    bail: process.env.CI ? 1 : 0, // Fast fail in CI
}

module.exports = createJestConfig(customJestConfig)
