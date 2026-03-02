import request from 'supertest';
import app from '../../app';
import { 
    createTestUser, 
    createTestReport,
    generateAuthToken,
    createAdminUser,
    cleanupTestUsers,
    cleanupTestReports
} from '../utils/testUtils';

describe('Report API Integration Tests', () => {
    beforeEach(async () => {
        await cleanupTestUsers();
        await cleanupTestReports();
    });

    afterAll(async () => {
        await cleanupTestUsers();
        await cleanupTestReports();
    });

    test('should reject report submission without auth', async () => {
        const user = await createTestUser();

        const res = await request(app)
            .post('/api/reports')
            .send({ reportedUser: user._id.toString(), reason: 'spam' });

        expect(res.statusCode).toBe(401);
    });

    test('should handle report submission with auth without server error', async () => {
        const reporter = await createTestUser();
        const reported = await createTestUser();
        const token = generateAuthToken(reporter);

        const res = await request(app)
            .post('/api/reports')
            .set('Authorization', `Bearer ${token}`)
            .send({ reportedUser: reported._id.toString(), reason: 'inappropriate_behavior', description: 'User was rude' });

        expect(res.statusCode).toBeLessThan(500);
    });

    test('should fetch admin report stats without server error', async () => {
        const admin = await createAdminUser();
        const token = generateAuthToken(admin);

        const res = await request(app)
            .get('/api/reports/admin/stats')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBeLessThan(500);
    });
});
