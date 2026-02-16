import { UserModel } from '../../modules/user.model';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../../configs';

export const createTestUser = async (overrides = {}) => {
    const defaultUser = {
        fullName: 'Test User',
        email: `test${Date.now()}@example.com`,
        phoneNumber: `${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        password: await bcryptjs.hash('Test@123', 10),
        role: 'user',
        bio: 'Test bio',
        location: 'Test location'
    };

    const user = new UserModel({ ...defaultUser, ...overrides });
    await user.save();
    return user;
};

export const createAdminUser = async () => {
    return await createTestUser({ role: 'admin' });
};

export const generateAuthToken = (user: any) => {
    const payload = {
        id: user._id,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

export const cleanupTestUsers = async () => {
    await UserModel.deleteMany({ email: { $regex: /test.*@example\.com/ } });
};
