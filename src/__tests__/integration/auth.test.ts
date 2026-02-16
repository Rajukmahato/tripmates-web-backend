import request from 'supertest';
import app from '../../app';
import { UserModel } from '../../modules/user.model';
import { createTestUser, cleanupTestUsers } from '../utils/testUtils';
import crypto from 'crypto';

describe('Auth API Integration Tests', () => {
    beforeEach(async () => {
        await cleanupTestUsers();
    });

    afterAll(async () => {
        await cleanupTestUsers();
    });

    describe('POST /api/auth/register', () => {
        const validUser = {
            fullName: 'John Doe',
            email: 'testregister@example.com',
            phoneNumber: '9876543210',
            password: 'Test@123',
            confirmPassword: 'Test@123'
        };

        test('should register a new user with valid data', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send(validUser);

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Registered Successfully');
            expect(res.body.data).toHaveProperty('email', validUser.email);
        });

        test('should fail if email is missing', async () => {
            const { email, ...userWithoutEmail } = validUser;
            const res = await request(app)
                .post('/api/auth/register')
                .send(userWithoutEmail);

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
        });

        test('should fail if fullName is missing', async () => {
            const { fullName, ...userWithoutName } = validUser;
            const res = await request(app)
                .post('/api/auth/register')
                .send(userWithoutName);

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
        });

        test('should fail if passwords do not match', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ ...validUser, confirmPassword: 'Different@123' });

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
        });

        test('should fail if email is already in use', async () => {
            await createTestUser({ email: validUser.email, phoneNumber: '1234567890' });
            
            const res = await request(app)
                .post('/api/auth/register')
                .send(validUser);

            expect(res.statusCode).toBe(409);
            expect(res.body.message).toBe('Email already in use');
        });

        test('should fail if phone number is already in use', async () => {
            await createTestUser({ email: 'different@example.com', phoneNumber: validUser.phoneNumber });
            
            const res = await request(app)
                .post('/api/auth/register')
                .send(validUser);

            expect(res.statusCode).toBe(409);
            expect(res.body.message).toBe('Phone Number already in use');
        });

        test('should fail with invalid email format', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ ...validUser, email: 'invalid-email' });

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
        });

        test('should fail with short password', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ ...validUser, password: 'short', confirmPassword: 'short' });

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
        });

        test('should fail with invalid phone number format', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ ...validUser, phoneNumber: '123' });

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });

    describe('POST /api/auth/login', () => {
        test('should login with valid credentials', async () => {
            const user = await createTestUser({
                email: 'testlogin@example.com',
                phoneNumber: '9876543211'
            });

            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'testlogin@example.com',
                    password: 'Test@123'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.token).toBeDefined();
            expect(res.body.data).toHaveProperty('email', 'testlogin@example.com');
        });

        test('should fail with non-existent email', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'Test@123'
                });

            expect(res.statusCode).toBe(404);
            expect(res.body.message).toBe('User not found!');
        });

        test('should fail with incorrect password', async () => {
            await createTestUser({
                email: 'testlogin2@example.com',
                phoneNumber: '9876543212'
            });

            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'testlogin2@example.com',
                    password: 'WrongPassword'
                });

            expect(res.statusCode).toBe(401);
            expect(res.body.message).toBe('Invalid credentials');
        });

        test('should fail with invalid email format', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'invalid-email',
                    password: 'Test@123'
                });

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
        });

        test('should fail with missing password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com'
                });

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });

    describe('POST /api/auth/forgot-password', () => {
        test('should return success message for existing email', async () => {
            await createTestUser({
                email: 'forgotpassword@example.com',
                phoneNumber: '9876543213'
            });

            const res = await request(app)
                .post('/api/auth/forgot-password')
                .send({ email: 'forgotpassword@example.com' });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toContain('reset link');
        });

        test('should return generic message for non-existent email', async () => {
            const res = await request(app)
                .post('/api/auth/forgot-password')
                .send({ email: 'nonexistent@example.com' });

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toContain('reset link');
        });

        test('should fail with invalid email format', async () => {
            const res = await request(app)
                .post('/api/auth/forgot-password')
                .send({ email: 'invalid-email' });

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
        });

        test('should set reset token in database', async () => {
            const user = await createTestUser({
                email: 'resettoken@example.com',
                phoneNumber: '9876543214'
            });

            await request(app)
                .post('/api/auth/forgot-password')
                .send({ email: 'resettoken@example.com' });

            const updatedUser = await UserModel.findById(user._id);
            expect(updatedUser?.resetPasswordToken).toBeDefined();
            expect(updatedUser?.resetPasswordExpires).toBeDefined();
        });
    });

    describe('POST /api/auth/reset-password', () => {
        test('should reset password with valid token', async () => {
            const user = await createTestUser({
                email: 'resetpass@example.com',
                phoneNumber: '9876543215'
            });

            // Generate reset token
            const resetToken = crypto.randomBytes(32).toString('hex');
            const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

            // Update user with reset token
            await UserModel.findByIdAndUpdate(user._id, {
                resetPasswordToken: hashedToken,
                resetPasswordExpires: new Date(Date.now() + 3600000)
            });

            const res = await request(app)
                .post('/api/auth/reset-password')
                .send({
                    token: resetToken,
                    password: 'NewPass@123',
                    confirmPassword: 'NewPass@123'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Password reset successful');
        });

        test('should fail with invalid token', async () => {
            const res = await request(app)
                .post('/api/auth/reset-password')
                .send({
                    token: 'invalid-token',
                    password: 'NewPass@123',
                    confirmPassword: 'NewPass@123'
                });

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toBe('Invalid or expired reset token');
        });

        test('should fail with expired token', async () => {
            const user = await createTestUser({
                email: 'expiredtoken@example.com',
                phoneNumber: '9876543216'
            });

            const resetToken = crypto.randomBytes(32).toString('hex');
            const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

            // Set expired token
            await UserModel.findByIdAndUpdate(user._id, {
                resetPasswordToken: hashedToken,
                resetPasswordExpires: new Date(Date.now() - 3600000) // 1 hour ago
            });

            const res = await request(app)
                .post('/api/auth/reset-password')
                .send({
                    token: resetToken,
                    password: 'NewPass@123',
                    confirmPassword: 'NewPass@123'
                });

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toBe('Invalid or expired reset token');
        });

        test('should fail with mismatched passwords', async () => {
            const res = await request(app)
                .post('/api/auth/reset-password')
                .send({
                    token: 'some-token',
                    password: 'NewPass@123',
                    confirmPassword: 'DifferentPass@123'
                });

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
        });

        test('should fail with weak password', async () => {
            const res = await request(app)
                .post('/api/auth/reset-password')
                .send({
                    token: 'some-token',
                    password: 'weak',
                    confirmPassword: 'weak'
                });

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });
});
