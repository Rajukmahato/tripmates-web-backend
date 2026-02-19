import request from 'supertest';
import app from '../../app';
import { createTestUser, createAdminUser, generateAuthToken, cleanupTestUsers } from '../utils/testUtils';

describe('Admin API Integration Tests', () => {
    let adminToken: string;
    let adminUser: any;

    beforeEach(async () => {
        await cleanupTestUsers();
        adminUser = await createAdminUser();
        adminToken = generateAuthToken(adminUser);
    });

    afterAll(async () => {
        await cleanupTestUsers();
    });

    describe('POST /api/admin/users', () => {
        test('should create user as admin', async () => {
            const res = await request(app)
                .post('/api/admin/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    fullName: 'Admin Created User',
                    email: `admincreated${Date.now()}@example.com`,
                    phoneNumber: `${Math.floor(1000000000 + Math.random() * 9000000000)}`,
                    password: 'Test@123'
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
        });

        test('should fail without admin role', async () => {
            const user = await createTestUser();
            const token = generateAuthToken(user);

            const res = await request(app)
                .post('/api/admin/users')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    fullName: 'Test',
                    email: `test${Date.now()}@example.com`,
                    phoneNumber: `${Math.floor(1000000000 + Math.random() * 9000000000)}`,
                    password: 'Test@123'
                });

            expect(res.statusCode).toBe(403);
        });
    });

    describe('GET /api/admin/users', () => {
        test('should get all users with pagination', async () => {
            const res = await request(app)
                .get('/api/admin/users?page=1&limit=10')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    describe('GET /api/admin/users/:id', () => {
        test('should get user by ID as admin', async () => {
            const user = await createTestUser();

            const res = await request(app)
                .get(`/api/admin/users/${user._id}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
        });
    });

    
});
