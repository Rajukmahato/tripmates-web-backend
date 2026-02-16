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
            const user = await createTestUser({
                email: 'profile@example.com',
                phoneNumber: '9876543220'
            });

            const res = await request(app)
                .get(`/api/user/profile/${user._id}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('email', 'profile@example.com');
            expect(res.body.data).not.toHaveProperty('password');
        });

        test('should return 404 for non-existent user', async () => {
            const fakeId = '507f1f77bcf86cd799439011';
            const res = await request(app)
                .get(`/api/user/profile/${fakeId}`);

            expect(res.statusCode).toBe(404);
            expect(res.body.message).toBe('User not found');
        });

        test('should not include password in response', async () => {
            const user = await createTestUser({
                email: 'nopassword@example.com',
                phoneNumber: '9876543221'
            });

            const res = await request(app)
                .get(`/api/user/profile/${user._id}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.data).not.toHaveProperty('password');
        });
    });

    describe('PUT /api/auth/:id', () => {
        test('should update user profile with authentication', async () => {
            const user = await createTestUser({
                email: 'updateprofile@example.com',
                phoneNumber: '9876543222'
            });
            const token = generateAuthToken(user);

            const updateData = {
                fullName: 'Updated Name',
                bio: 'Updated bio'
            };

            const res = await request(app)
                .put(`/api/auth/${user._id}`)
                .set('Authorization', `Bearer ${token}`)
                .send(updateData);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('fullName', 'Updated Name');
            expect(res.body.data).toHaveProperty('bio', 'Updated bio');
        });

        test('should fail without authentication', async () => {
            const user = await createTestUser({
                email: 'noauth@example.com',
                phoneNumber: '9876543223'
            });

            const res = await request(app)
                .put(`/api/auth/${user._id}`)
                .send({ fullName: 'Updated Name' });

            expect(res.statusCode).toBe(401);
        });

        test('should fail when user updates another user profile', async () => {
            const user1 = await createTestUser({
                email: 'user1@example.com',
                phoneNumber: '9876543224'
            });
            const user2 = await createTestUser({
                email: 'user2@example.com',
                phoneNumber: '9876543225'
            });
            const token = generateAuthToken(user1);

            const res = await request(app)
                .put(`/api/auth/${user2._id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ fullName: 'Hacked Name' });

            expect(res.statusCode).toBe(403);
        });

        test('should fail with invalid phone number format', async () => {
            const user = await createTestUser({
                email: 'invalidphone@example.com',
                phoneNumber: '9876543226'
            });
            const token = generateAuthToken(user);

            const res = await request(app)
                .put(`/api/auth/${user._id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ phoneNumber: '123' });

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
        });

        test('should update location field', async () => {
            const user = await createTestUser({
                email: 'updatelocation@example.com',
                phoneNumber: '9876543227'
            });
            const token = generateAuthToken(user);

            const res = await request(app)
                .put(`/api/auth/${user._id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ location: 'New York' });

            expect(res.statusCode).toBe(200);
            expect(res.body.data).toHaveProperty('location', 'New York');
        });

        test('should fail with duplicate phone number', async () => {
            const user1 = await createTestUser({
                email: 'user1phone@example.com',
                phoneNumber: '9876543228'
            });
            const user2 = await createTestUser({
                email: 'user2phone@example.com',
                phoneNumber: '9876543229'
            });
            const token = generateAuthToken(user2);

            const res = await request(app)
                .put(`/api/auth/${user2._id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ phoneNumber: '9876543228' });

            expect(res.statusCode).toBe(409);
            expect(res.body.message).toBe('Phone number already in use');
        });
    });
});
