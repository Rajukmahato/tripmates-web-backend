import request from 'supertest';
import app from '../../app';
import { createTestUser, generateAuthToken, cleanupTestUsers } from '../utils/testUtils';

describe('User API Integration Tests', () => {
    beforeEach(async () => {
        await cleanupTestUsers();
    });

    afterAll(async () => {
        await cleanupTestUsers();
    });

    describe('GET /api/user/profile/:userId', () => {
        test('should get user profile by ID', async () => {
            const user = await createTestUser();

            const res = await request(app)
                .get(`/api/user/profile/${user._id}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.data).toHaveProperty('email');
            expect(res.body.data).not.toHaveProperty('password');
        });

        test('should return 404 for non-existent user', async () => {
            const res = await request(app)
                .get('/api/user/profile/507f1f77bcf86cd799439011');

            expect(res.statusCode).toBe(404);
        });
    });

    describe('PUT /api/auth/:id', () => {
        test('should update user profile', async () => {
            const user = await createTestUser();
            const token = generateAuthToken(user);

            const res = await request(app)
                .put(`/api/auth/${user._id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ fullName: 'Updated Name', bio: 'New bio' });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
        });

        test('should fail without authentication', async () => {
            const user = await createTestUser();

            const res = await request(app)
                .put(`/api/auth/${user._id}`)
                .send({ fullName: 'Updated Name' });

            expect(res.statusCode).toBe(401);
        });

        test('should fail when updating another user profile', async () => {
            const user1 = await createTestUser();
            const user2 = await createTestUser();
            const token = generateAuthToken(user1);

            const res = await request(app)
                .put(`/api/auth/${user2._id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ fullName: 'Hacked' });

            expect(res.statusCode).toBe(403);
        });

        test('should fail with duplicate phone number', async () => {
            const user1 = await createTestUser();
            const user2 = await createTestUser();
            const token = generateAuthToken(user2);

            const res = await request(app)
                .put(`/api/auth/${user2._id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ phoneNumber: user1.phoneNumber });

            expect(res.statusCode).toBe(409);
        });
    });
});
