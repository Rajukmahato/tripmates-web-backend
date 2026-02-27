import request from 'supertest';
import app from '../../app';
import { 
    createTestUser, 
    createTestNotification,
    generateAuthToken, 
    cleanupTestUsers,
    cleanupTestNotifications
} from '../utils/testUtils';

describe('Notification API Integration Tests', () => {
    beforeEach(async () => {
        await cleanupTestUsers();
        await cleanupTestNotifications();
    });

    afterAll(async () => {
        await cleanupTestUsers();
        await cleanupTestNotifications();
    });

    test('should reject token registration without auth', async () => {
        const res = await request(app)
            .post('/api/notifications/register-token')
            .send({ fcmToken: 'test-token' });

        expect(res.statusCode).toBe(401);
    });

    test('should handle token registration with auth without server error', async () => {
        const user = await createTestUser();
        const token = generateAuthToken(user);

        const res = await request(app)
            .post('/api/notifications/register-token')
            .set('Authorization', `Bearer ${token}`)
            .send({ fcmToken: 'test-token' });

        expect(res.statusCode).toBeLessThan(500);
    });

    test('should fetch notifications with auth without server error', async () => {
        const user = await createTestUser();
        const token = generateAuthToken(user);
        await createTestNotification(user._id.toString());

        const res = await request(app)
            .get('/api/notifications')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBeLessThan(500);
    });
});
