import { connectDb } from '../database/mongodb';
import mongoose from 'mongoose';
import { cleanupAllTestData } from './utils/testUtils';

// Extend Jest matchers
declare global {
    namespace jest {
        interface Matchers<R> {
            toBeOneOf(expected: number[]): R;
        }
    }
}

expect.extend({
    toBeOneOf(received: number, accepted: number[]) {
        const pass = accepted.includes(received);
        return {
            pass,
            message: () => 
                `expected ${received} to be one of ${accepted.join(', ')}`
        };
    }
});

beforeAll(async () => {
    // Ensure we're in test mode
    if (process.env.NODE_ENV !== 'test') {
        throw new Error('Tests must run with NODE_ENV=test to prevent touching production database!');
    }
    await connectDb();
    await cleanupAllTestData();
    console.log('✓ Test database connected');
});

beforeEach(async () => {
    await cleanupAllTestData();
});

afterAll(async () => {
    // Clean up ALL test data from test database
    if (process.env.NODE_ENV === 'test') {
        await cleanupAllTestData();
        console.log('✓ Test database cleaned');
    }
    await mongoose.connection.close();
});
