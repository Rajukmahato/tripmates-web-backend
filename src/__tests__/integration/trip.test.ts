import request from 'supertest';
import app from '../../app';
import { 
    createTestUser, 
    createTestTrip,
    generateAuthToken, 
    cleanupTestUsers,
    cleanupTestTrips 
} from '../utils/testUtils';

describe('Trip API Integration Tests', () => {
    beforeEach(async () => {
        await cleanupTestUsers();
        await cleanupTestTrips();
    });

    afterAll(async () => {
        await cleanupTestUsers();
        await cleanupTestTrips();
    });

    describe('POST /api/trips', () => {
        test('should create a trip successfully', async () => {
            const user = await createTestUser();
            const token = generateAuthToken(user);

            const tripData = {
                description: 'Beach vacation',
                destination: 'Goa, India',
                startDate: new Date(Date.now() + 86400000).toISOString(),
                endDate: new Date(Date.now() + 86400000 * 7).toISOString(),
                budget: 30000,
                travelType: 'leisure',
                groupSize: 4
            };

            const res = await request(app)
                .post('/api/trips')
                .set('Authorization', `Bearer ${token}`)
                .send(tripData);

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('destination');
        });

        test('should fail without authentication', async () => {
            const tripData = {
                destination: 'Test',
                startDate: new Date(Date.now() + 86400000).toISOString(),
                endDate: new Date(Date.now() + 86400000 * 7).toISOString(),
                budget: 20000,
                travelType: 'leisure',
                groupSize: 3
            };

            const res = await request(app)
                .post('/api/trips')
                .send(tripData);

            expect(res.statusCode).toBe(401);
        });
    });

    describe('GET /api/trips', () => {
        test('should get all trips', async () => {
            const user = await createTestUser();
            await createTestTrip(user._id.toString());

            const res = await request(app)
                .get('/api/trips');

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    describe('GET /api/trips/:id', () => {
        test('should get trip by ID', async () => {
            const user = await createTestUser();
            const trip = await createTestTrip(user._id.toString());

            const res = await request(app)
                .get(`/api/trips/${trip._id}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.data).toHaveProperty('destination');
        });
    });

    describe('GET /api/trips/user/:userId', () => {
        test('should get trips by creator', async () => {
            const user = await createTestUser();
            await createTestTrip(user._id.toString());

            const res = await request(app)
                .get(`/api/trips/user/${user._id}`);

            expect(res.statusCode).toBe(200);
        });
    });

    describe('PUT /api/trips/:id', () => {
        test('should update own trip', async () => {
            const user = await createTestUser();
            const token = generateAuthToken(user);
            const trip = await createTestTrip(user._id.toString());

            const res = await request(app)
                .put(`/api/trips/${trip._id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ budget: 50000 });

            expect(res.statusCode).toBe(200);
        });
    });

    describe('DELETE /api/trips/:id', () => {
        test('should delete own trip', async () => {
            const user = await createTestUser();
            const token = generateAuthToken(user);
            const trip = await createTestTrip(user._id.toString());

            const res = await request(app)
                .delete(`/api/trips/${trip._id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
        });
    });

    describe('PUT /api/trips/:id/itinerary', () => {
        test('should update trip itinerary', async () => {
            const user = await createTestUser();
            const token = generateAuthToken(user);
            const trip = await createTestTrip(user._id.toString());

            const res = await request(app)
                .put(`/api/trips/${trip._id}/itinerary`)
                .set('Authorization', `Bearer ${token}`)
                .send({ itinerary: [{ day: 1, title: 'Day 1' }] });

            expect(res.statusCode).toBe(200);
        });
    });

    describe('PUT /api/trips/:id/checklist', () => {
        test('should update trip checklist', async () => {
            const user = await createTestUser();
            const token = generateAuthToken(user);
            const trip = await createTestTrip(user._id.toString());

            const res = await request(app)
                .put(`/api/trips/${trip._id}/checklist`)
                .set('Authorization', `Bearer ${token}`)
                .send({ travelChecklist: ['Passport'] });

            expect(res.statusCode).toBe(200);
        });
    });
});
