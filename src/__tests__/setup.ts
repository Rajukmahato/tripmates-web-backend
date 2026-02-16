import { connectDb } from '../database/mongodb';
import mongoose from 'mongoose';
import { UserModel } from '../modules/user.model';

beforeAll(async () => {
    // Ensure we're in test mode
    if (process.env.NODE_ENV !== 'test') {
        throw new Error('Tests must run with NODE_ENV=test to prevent touching production database!');
    }
    await connectDb();
    console.log('✓ Test database connected');
});

afterAll(async () => {
    // Clean up ALL test data from test database
    if (process.env.NODE_ENV === 'test') {
        await UserModel.deleteMany({});
        console.log('✓ Test database cleaned');
    }
    await mongoose.connection.close();
});
