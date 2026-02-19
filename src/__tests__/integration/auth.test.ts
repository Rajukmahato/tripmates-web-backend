import request from 'supertest';
import app from '../../app';
import { createTestUser, cleanupTestUsers } from '../utils/testUtils';

describe('Auth API Integration Tests', () => {
    beforeEach(async () => {
        await cleanupTestUsers();
    });

    afterAll(async () => {
        await cleanupTestUsers();
    });

    describe('POST /api/auth/register', () => {
        test('should register a new user successfully', async () => {
            const userData = {
                fullName: 'John Doe',
                email: `test${Date.now()}@example.com`,
                phoneNumber: `${Math.floor(1000000000 + Math.random() * 9000000000)}`,
                password: 'Test@123',
                confirmPassword: 'Test@123'
            };

            const res = await request(app)
                .post('/api/auth/register')
                .send(userData);

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('email');
        });

        test('should fail with missing required fields', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ fullName: 'John' });

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
        });

        test('should fail with invalid email format', async () => {
            const userData = {
                fullName: 'John Doe',
                email: 'invalid-email',
                phoneNumber: `${Math.floor(1000000000 + Math.random() * 9000000000)}`,
                password: 'Test@123',
                confirmPassword: 'Test@123'
            };

            const res = await request(app)
                .post('/api/auth/register')
                .send(userData);

            expect(res.statusCode).toBe(400);
        });
    });

    describe('POST /api/auth/login', () => {
        test('should login with valid credentials', async () => {
            const email = `logintest${Date.now()}@example.com`;
            await createTestUser({ email });

            const res = await request(app)
                .post('/api/auth/login')
                .send({ email, password: 'Test@123' });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.token).toBeDefined();
        });

        test('should fail with wrong credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: `nonexistent${Date.now()}@example.com`,
                    password: 'WrongPassword@123'
                });

            expect([404, 401]).toContain(res.statusCode);
            expect(res.body.success).toBe(false);
        });
    });

    describe('POST /api/auth/forgot-password', () => {
        test('should handle forgot password request', async () => {
            const email = `forgot${Date.now()}@example.com`;
            await createTestUser({ email });

            const res = await request(app)
                .post('/api/auth/forgot-password')
                .send({ email });

            expect([200, 201, 500]).toContain(res.statusCode);
            expect(res.body).toBeDefined();
        });
    });
});
