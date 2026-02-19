// Set NODE_ENV to 'test' before running any tests
// This ensures tests use the test database and not production
process.env.NODE_ENV = 'test';

// Load test-specific environment variables
const dotenv = require('dotenv');
const path = require('path');

// Load .env.test if it exists
const testEnvPath = path.resolve(__dirname, '../../.env.test');
dotenv.config({ path: testEnvPath });

// Safety checks to prevent accidental production database usage
if (process.env.MONGODB_URI && process.env.MONGODB_URI.includes('tripmates_prod')) {
    throw new Error('❌ FATAL: Tests are trying to connect to PRODUCTION database! Aborting.');
}

// Ensure we're using test database
if (!process.env.MONGODB_TEST_URI) {
    console.warn('⚠️ MONGODB_TEST_URI not set, will use default test database');
}

console.log('✓ Test environment configured');
console.log(`✓ Test database: ${process.env.MONGODB_TEST_URI ? 'tripmates_test' : 'default test db'}`);
