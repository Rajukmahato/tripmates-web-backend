import request from 'supertest';
import app from '../../app';
import { 
    createTestUser, 
    createTestTrip,
    createTestReview,
    generateAuthToken,
    createAdminUser,
    cleanupTestUsers,
    cleanupTestTrips,
    cleanupTestReviews
} from '../utils/testUtils';

describe('Review API Integration Tests', () => {
    beforeEach(async () => {
        await cleanupTestUsers();
        await cleanupTestTrips();
        await cleanupTestReviews();
    });

    afterAll(async () => {
        await cleanupTestUsers();
        await cleanupTestTrips();
        await cleanupTestReviews();
    });

    test('should reject review submission without auth', async () => {
        const user = await createTestUser();
        const trip = await createTestTrip(user._id.toString());

        const res = await request(app)
            .post('/api/reviews')
            .send({ reviewedUser: user._id.toString(), trip: trip._id.toString(), rating: 5 });

        expect(res.statusCode).toBe(401);
    });

    test('should handle review submission with auth without server error', async () => {
        const reviewer = await createTestUser();
        const reviewed = await createTestUser();
        const trip = await createTestTrip(reviewer._id.toString());
        const token = generateAuthToken(reviewer);

        const res = await request(app)
            .post('/api/reviews')
            .set('Authorization', `Bearer ${token}`)
            .send({ reviewedUser: reviewed._id.toString(), trip: trip._id.toString(), rating: 5, comment: 'Great partner!' });

        expect(res.statusCode).toBeLessThan(500);
    });

    test('should fetch public user reviews without server error', async () => {
        const reviewer = await createTestUser();
        const reviewed = await createTestUser();
        const trip = await createTestTrip(reviewer._id.toString());

        await createTestReview(reviewer._id.toString(), reviewed._id.toString(), trip._id.toString());

        const res = await request(app).get(`/api/reviews/user/${reviewed._id}`);
        expect(res.statusCode).toBeLessThan(500);
    });
});
