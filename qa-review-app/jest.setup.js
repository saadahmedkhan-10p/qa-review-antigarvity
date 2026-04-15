import '@testing-library/jest-dom'
const { TextEncoder, TextDecoder } = require('util')

// Polyfill Web APIs for JSDOM
if (typeof global.TextEncoder === 'undefined') {
    global.TextEncoder = TextEncoder
}

if (typeof global.TextDecoder === 'undefined') {
    global.TextDecoder = TextDecoder
}

// Mock Request/Response for Next.js actions/middleware in tests
if (typeof global.Request === 'undefined') {
    global.Request = class {
        constructor() { }
    }
}

if (typeof global.Response === 'undefined') {
    global.Response = class {
        constructor() { }
        static json(data) {
            return {
                ok: true,
                json: async () => data
            }
        }
    }
}
