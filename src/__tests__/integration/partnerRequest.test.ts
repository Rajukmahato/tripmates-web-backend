import request from 'supertest';
import app from '../../app';
import { 
    createTestUser, 
    createTestTrip,
    createTestPartnerRequest,
    generateAuthToken, 
    cleanupTestUsers,
    cleanupTestTrips,
    cleanupTestPartnerRequests 
} from '../utils/testUtils';

describe('Partner Request API Integration Tests', () => {
    beforeEach(async () => {
        await cleanupTestUsers();
        await cleanupTestTrips();
        await cleanupTestPartnerRequests();
    });

    afterAll(async () => {
        await cleanupTestUsers();
        await cleanupTestTrips();
        await cleanupTestPartnerRequests();
    });

    test('should reject create request without auth', async () => {
        const user1 = await createTestUser();
        const user2 = await createTestUser();
        const trip = await createTestTrip(user1._id.toString());

        const res = await request(app)
            .post('/api/partner-requests')
            .send({ to: user2._id.toString(), trip: trip._id.toString() });

        expect(res.statusCode).toBe(401);
    });

    test('should handle create request with auth without server error', async () => {
        const user1 = await createTestUser();
        const user2 = await createTestUser();
        const trip = await createTestTrip(user1._id.toString());
        const token = generateAuthToken(user1);

        const res = await request(app)
            .post('/api/partner-requests')
            .set('Authorization', `Bearer ${token}`)
            .send({ to: user2._id.toString(), trip: trip._id.toString(), message: 'Join my trip?' });

        expect(res.statusCode).toBeLessThan(500);
    });

    test('should fetch sent requests without server error', async () => {
        const user1 = await createTestUser();
        const user2 = await createTestUser();
        const trip = await createTestTrip(user1._id.toString());
        const token = generateAuthToken(user1);

        await createTestPartnerRequest(user1._id.toString(), user2._id.toString(), trip._id.toString());

        const res = await request(app)
            .get('/api/partner-requests/sent')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBeLessThan(500);
    });
});
