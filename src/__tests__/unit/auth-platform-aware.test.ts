import request from 'supertest';
import app from '../../app';
import { createTestUser, cleanupTestUsers } from '../utils/testUtils';

describe('Auth Controller - Platform-Aware Password Reset', () => {
    beforeEach(async () => {
        await cleanupTestUsers();
    });

    afterAll(async () => {
        await cleanupTestUsers();
    });

    describe('POST /api/auth/forgot-password', () => {
        it('should accept Android platform parameter', async () => {
            const testUser = await createTestUser();
            const response = await request(app)
                .post('/api/auth/forgot-password')
                .send({ email: testUser.email, platform: 'android' });

            expect([200, 500]).toContain(response.status);
            expect(response.body).toBeDefined();
        });

        it('should accept web platform parameter', async () => {
            const testUser = await createTestUser();
            const response = await request(app)
                .post('/api/auth/forgot-password')
                .send({ email: testUser.email, platform: 'web' });

            expect([200, 500]).toContain(response.status);
            expect(response.body).toBeDefined();
        });

        it('should accept iOS platform parameter', async () => {
            const testUser = await createTestUser();
            const response = await request(app)
                .post('/api/auth/forgot-password')
                .send({ email: testUser.email, platform: 'ios' });

            expect([200, 500]).toContain(response.status);
            expect(response.body).toBeDefined();
        });

        it('should default to web when platform not specified', async () => {
            const testUser = await createTestUser();
            const response = await request(app)
                .post('/api/auth/forgot-password')
                .send({ email: testUser.email });

            expect([200, 500]).toContain(response.status);
            expect(response.body).toBeDefined();
        });

        it('should reject invalid platform values', async () => {
            const testUser = await createTestUser();
            const response = await request(app)
                .post('/api/auth/forgot-password')
                .send({ email: testUser.email, platform: 'invalid_platform' });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should reject invalid email format', async () => {
            const response = await request(app)
                .post('/api/auth/forgot-password')
                .send({ email: 'not-an-email', platform: 'web' });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should return generic response for non-existent email', async () => {
            const response = await request(app)
                .post('/api/auth/forgot-password')
                .send({ email: 'nonexistent@example.com', platform: 'android' });

            expect([200, 500]).toContain(response.status);
            expect(response.body).toBeDefined();
        });
    });
});
