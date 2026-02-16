import request from 'supertest';
import app from '../../app';
import { createTestUser, createAdminUser, generateAuthToken, cleanupTestUsers } from '../utils/testUtils';

describe('Admin API Integration Tests', () => {
    let adminUser: any;
    let adminToken: string;

    beforeAll(async () => {
        await cleanupTestUsers();
        adminUser = await createAdminUser();
        adminToken = generateAuthToken(adminUser);
    });

    beforeEach(async () => {
        // Clean up test users but keep admin
        const adminId = adminUser._id.toString();
        const testUsers = await require('../../modules/user.model').UserModel.find({ 
            email: { $regex: /test.*@example\.com/ },
            _id: { $ne: adminId }
        });
        for (const user of testUsers) {
            await user.deleteOne();
        }
    });

    afterAll(async () => {
        await cleanupTestUsers();
    });

    describe('POST /api/admin/users', () => {
        test('should create user as admin', async () => {
            const userData = {
                fullName: 'Admin Created User',
                email: 'admincreated@example.com',
                phoneNumber: '9876543230',
                password: 'Test@123',
                bio: 'Admin created',
                location: 'Test City'
            };

            const res = await request(app)
                .post('/api/admin/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(userData);

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('email', userData.email);
        });

        test('should fail without admin role', async () => {
            const regularUser = await createTestUser({
                email: 'regular@example.com',
                phoneNumber: '9876543231'
            });
            const regularToken = generateAuthToken(regularUser);

            const res = await request(app)
                .post('/api/admin/users')
                .set('Authorization', `Bearer ${regularToken}`)
                .send({
                    fullName: 'Test',
                    email: 'test@example.com',
                    phoneNumber: '9876543232',
                    password: 'Test@123'
                });

            expect(res.statusCode).toBe(403);
            expect(res.body.message).toContain('Admin');
        });

        test('should fail without authentication', async () => {
            const res = await request(app)
                .post('/api/admin/users')
                .send({
                    fullName: 'Test',
                    email: 'test@example.com',
                    phoneNumber: '9876543233',
                    password: 'Test@123'
                });

            expect(res.statusCode).toBe(401);
        });

        test('should fail with duplicate email', async () => {
            const existingUser = await createTestUser({
                email: 'existing@example.com',
                phoneNumber: '9876543234'
            });

            const res = await request(app)
                .post('/api/admin/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    fullName: 'Test',
                    email: 'existing@example.com',
                    phoneNumber: '9876543235',
                    password: 'Test@123'
                });

            expect(res.statusCode).toBe(409);
            expect(res.body.message).toBe('Email already in use');
        });
    });

    describe('GET /api/admin/users', () => {
        test('should get all users with pagination', async () => {
            // Create some test users
            await createTestUser({ email: 'testuser1@example.com', phoneNumber: '9876543236' });
            await createTestUser({ email: 'testuser2@example.com', phoneNumber: '9876543237' });

            const res = await request(app)
                .get('/api/admin/users?page=1&limit=10')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toBeInstanceOf(Array);
            expect(res.body.pagination).toBeDefined();
            expect(res.body.pagination).toHaveProperty('currentPage');
            expect(res.body.pagination).toHaveProperty('totalPages');
            expect(res.body.pagination).toHaveProperty('totalCount');
        });

        test('should fail without authentication', async () => {
            const res = await request(app)
                .get('/api/admin/users');

            expect(res.statusCode).toBe(401);
        });

        test('should fail without admin role', async () => {
            const regularUser = await createTestUser({
                email: 'regularuser@example.com',
                phoneNumber: '9876543238'
            });
            const regularToken = generateAuthToken(regularUser);

            const res = await request(app)
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${regularToken}`);

            expect(res.statusCode).toBe(403);
        });

        test('should respect pagination limit', async () => {
            // Create multiple test users
            for (let i = 0; i < 5; i++) {
                await createTestUser({ 
                    email: `paginationtest${i}@example.com`, 
                    phoneNumber: `987654${3240 + i}` 
                });
            }

            const res = await request(app)
                .get('/api/admin/users?page=1&limit=3')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.length).toBeLessThanOrEqual(3);
        });
    });

    describe('GET /api/admin/users/:id', () => {
        test('should get user by ID as admin', async () => {
            const user = await createTestUser({
                email: 'getbyid@example.com',
                phoneNumber: '9876543245'
            });

            const res = await request(app)
                .get(`/api/admin/users/${user._id}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('email', 'getbyid@example.com');
            expect(res.body.data).not.toHaveProperty('password');
        });

        test('should return 404 for non-existent user', async () => {
            const fakeId = '507f1f77bcf86cd799439011';
            const res = await request(app)
                .get(`/api/admin/users/${fakeId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(404);
            expect(res.body.message).toBe('User not found');
        });

        test('should fail without authentication', async () => {
            const user = await createTestUser({
                email: 'noauthget@example.com',
                phoneNumber: '9876543246'
            });

            const res = await request(app)
                .get(`/api/admin/users/${user._id}`);

            expect(res.statusCode).toBe(401);
        });
    });

    describe('PUT /api/admin/users/:id', () => {
        test('should update user as admin', async () => {
            const user = await createTestUser({
                email: 'adminupdate@example.com',
                phoneNumber: '9876543247'
            });

            const res = await request(app)
                .put(`/api/admin/users/${user._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    fullName: 'Admin Updated Name',
                    role: 'admin'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('fullName', 'Admin Updated Name');
        });

        test('should fail updating with duplicate email', async () => {
            const user1 = await createTestUser({
                email: 'user1@example.com',
                phoneNumber: '9876543248'
            });
            const user2 = await createTestUser({
                email: 'user2@example.com',
                phoneNumber: '9876543249'
            });

            const res = await request(app)
                .put(`/api/admin/users/${user2._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ email: 'user1@example.com' });

            expect(res.statusCode).toBe(409);
            expect(res.body.message).toBe('Email already in use');
        });

        test('should fail updating with duplicate phone number', async () => {
            const user1 = await createTestUser({
                email: 'phoneuser1@example.com',
                phoneNumber: '9876543250'
            });
            const user2 = await createTestUser({
                email: 'phoneuser2@example.com',
                phoneNumber: '9876543251'
            });

            const res = await request(app)
                .put(`/api/admin/users/${user2._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ phoneNumber: '9876543250' });

            expect(res.statusCode).toBe(409);
            expect(res.body.message).toBe('Phone number already in use');
        });

        test('should fail without authentication', async () => {
            const user = await createTestUser({
                email: 'noauthupdate@example.com',
                phoneNumber: '9876543252'
            });

            const res = await request(app)
                .put(`/api/admin/users/${user._id}`)
                .send({ fullName: 'Updated Name' });

            expect(res.statusCode).toBe(401);
        });

        test('should allow admin to change user role', async () => {
            const user = await createTestUser({
                email: 'changerole@example.com',
                phoneNumber: '9876543253'
            });

            const res = await request(app)
                .put(`/api/admin/users/${user._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ role: 'admin' });

            expect(res.statusCode).toBe(200);
        });
    });

    describe('DELETE /api/admin/users/:id', () => {
        test('should delete user as admin', async () => {
            const user = await createTestUser({
                email: 'deleteme@example.com',
                phoneNumber: '9876543254'
            });

            const res = await request(app)
                .delete(`/api/admin/users/${user._id}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toContain('deleted');
        });

        test('should return 404 for non-existent user', async () => {
            const fakeId = '507f1f77bcf86cd799439011';
            const res = await request(app)
                .delete(`/api/admin/users/${fakeId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(404);
            expect(res.body.message).toBe('User not found');
        });

        test('should fail without authentication', async () => {
            const user = await createTestUser({
                email: 'noauthdelete@example.com',
                phoneNumber: '9876543255'
            });

            const res = await request(app)
                .delete(`/api/admin/users/${user._id}`);

            expect(res.statusCode).toBe(401);
        });

        test('should fail without admin role', async () => {
            const regularUser = await createTestUser({
                email: 'regulardelete@example.com',
                phoneNumber: '9876543256'
            });
            const userToDelete = await createTestUser({
                email: 'tobedeleted@example.com',
                phoneNumber: '9876543257'
            });
            const regularToken = generateAuthToken(regularUser);

            const res = await request(app)
                .delete(`/api/admin/users/${userToDelete._id}`)
                .set('Authorization', `Bearer ${regularToken}`);

            expect(res.statusCode).toBe(403);
        });
    });
});
