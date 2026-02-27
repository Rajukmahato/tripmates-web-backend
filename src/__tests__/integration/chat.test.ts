import request from 'supertest';
import app from '../../app';
import {
    createTestUser,
    createTestTrip,
    generateAuthToken,
    cleanupTestUsers,
    cleanupTestTrips,
    cleanupTestConversations,
    cleanupTestMessages,
    cleanupTestGroupChats
} from '../utils/testUtils';

describe('Chat API Integration Tests', () => {
    beforeEach(async () => {
        await cleanupTestUsers();
        await cleanupTestTrips();
        await cleanupTestConversations();
        await cleanupTestMessages();
        await cleanupTestGroupChats();
    });

    afterAll(async () => {
        await cleanupTestUsers();
        await cleanupTestTrips();
        await cleanupTestConversations();
        await cleanupTestMessages();
        await cleanupTestGroupChats();
    });

    test('should reject unauthenticated access to conversations', async () => {
        const res = await request(app).get('/api/chat/conversations');
        expect(res.statusCode).toBe(401);
    });

    test('should ensure conversation with auth without server error', async () => {
        const user1 = await createTestUser({ email: 'chat-a@example.com' });
        const user2 = await createTestUser({ email: 'chat-b@example.com' });
        const token = generateAuthToken(user1);

        const res = await request(app)
            .post('/api/chat/conversations/ensure')
            .set('Authorization', `Bearer ${token}`)
            .send({ participantId: user2._id.toString() });

        expect(res.statusCode).toBeLessThan(500);
    });

    test('should list group chats with auth without server error', async () => {
        const user = await createTestUser({ email: 'chat-group@example.com' });
        await createTestTrip(user._id.toString());
        const token = generateAuthToken(user);

        const res = await request(app)
            .get('/api/chat/groups')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBeLessThan(500);
    });
});