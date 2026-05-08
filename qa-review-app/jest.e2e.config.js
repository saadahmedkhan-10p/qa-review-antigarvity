const nextJest = require('next/jest')

const createJestConfig = nextJest({
    dir: './',
})

const customJestConfig = {
    testEnvironment: 'node',
    testTimeout: 120000,
    testMatch: [
        '**/tests/e2e/**/*.test.ts',
    ],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
}

module.exports = createJestConfig(customJestConfig)
