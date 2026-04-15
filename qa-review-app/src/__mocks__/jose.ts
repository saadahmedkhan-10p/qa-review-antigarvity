/**
 * Mock for the jose library to avoid ESM issues in Jest/Next.js environment.
 * Provides simplified implementations for JWT signing and verification.
 */

class MockSignJWT {
    constructor(payload) {
        this.payload = payload;
    }
    setProtectedHeader(header) { return this; }
    setIssuedAt() { return this; }
    setExpirationTime(time) { return this; }
    async sign(secret) {
        return 'mocked-jwt-token';
    }
}

const jwtVerify = async (token, secret) => {
    return {
        payload: {
            user: {
                id: 'mock-user-id',
                name: 'Mock User',
                email: 'mock@example.com',
                roles: ['ADMIN']
            }
        }
    };
};

module.exports = {
    SignJWT: MockSignJWT,
    jwtVerify
};
