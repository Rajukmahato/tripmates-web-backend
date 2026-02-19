import { UserModel } from '../../modules/user.model';
import { TripModel } from '../../modules/trip.model';
import { PartnerRequestModel } from '../../modules/partnerRequest.model';
import { ConversationModel } from '../../modules/conversation.model';
import { MessageModel } from '../../modules/message.model';
import { NotificationModel } from '../../modules/notification.model';
import { ReviewModel } from '../../modules/review.model';
import { ReportModel } from '../../modules/report.model';
import { GroupChatModel } from '../../modules/groupChat.model';
import bcryptjs from 'bcryptjs';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../../configs';

export const createTestUser = async (overrides = {}) => {
    const defaultUser = {
        fullName: 'Test User',
        email: `test${Date.now()}@example.com`,
        phoneNumber: `${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        password: await bcryptjs.hash('Test@123', 10),
        role: 'user',
        bio: 'Test bio',
        location: 'Test location'
    };

    const user = new UserModel({ ...defaultUser, ...overrides });
    await user.save();
    return user;
};

export const createAdminUser = async () => {
    return await createTestUser({ role: 'admin' });
};

export const generateAuthToken = (user: any) => {
    const payload = {
        id: user._id,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

export const createTestTrip = async (userId: string, overrides = {}) => {
    const defaultTrip = {
        title: `Test Trip ${Date.now()}`,
        description: 'A test trip description',
        destination: 'Test Destination',
        startDate: new Date(Date.now() + 86400000), // Tomorrow
        endDate: new Date(Date.now() + 86400000 * 7), // Next week
        budget: 50000,
        maxTravelers: 5,
        createdBy: userId,
        creator: userId,
        status: 'open',
        tags: ['adventure', 'beach'],
        travelType: 'leisure',
        groupSize: 4,
        groupChatId: `group-${userId}-${Date.now()}`,
        itinerary: [],
        checkList: [],
        travelChecklist: []
    };

    const trip = new TripModel({ ...defaultTrip, ...overrides });
    await trip.save();
    return trip;
};

export const createTestPartnerRequest = async (fromUserId: string, toUserId: string, tripId: string, overrides = {}) => {
    const defaultRequest = {
        sender: fromUserId,
        receiver: toUserId,
        trip: tripId,
        status: 'pending',
        message: 'Would you like to join my trip?'
    };

    const request = new PartnerRequestModel({ ...defaultRequest, ...overrides });
    await request.save();
    return request;
};

export const createTestConversation = async (user1Id: string, user2Id: string, overrides = {}) => {
    const defaultConversation = {
        conversationId: `conv-${user1Id}-${user2Id}-${Date.now()}`,
        participants: [new mongoose.Types.ObjectId(user1Id), new mongoose.Types.ObjectId(user2Id)],
        lastMessage: null,
        lastMessageAt: new Date()
    };

    const conversation = new ConversationModel({ ...defaultConversation, ...overrides });
    await conversation.save();
    return conversation;
};

export const createTestMessage = async (conversationId: string, senderId: string, receiverId: string, overrides = {}) => {
    const defaultMessage = {
        conversationId,
        sender: senderId,
        receiver: receiverId,
        message: 'Test message content',
        read: false
    };

    const message = new MessageModel({ ...defaultMessage, ...overrides });
    await message.save();
    return message;
};

export const createTestNotification = async (userId: string, overrides = {}) => {
    const defaultNotification = {
        recipient: new mongoose.Types.ObjectId(userId),
        title: 'Test Notification',
        body: 'This is a test notification',
        type: 'trip_reminder',
        isRead: false
    };

    const notification = new NotificationModel({ ...defaultNotification, ...overrides });
    await notification.save();
    return notification;
};

export const createTestReview = async (reviewerId: string, reviewedUserId: string, tripId: string, overrides = {}) => {
    const defaultReview = {
        reviewer: reviewerId,
        reviewee: reviewedUserId,
        trip: tripId,
        rating: 4,
        comment: 'Great travel partner!'
    };

    const review = new ReviewModel({ ...defaultReview, ...overrides });
    await review.save();
    return review;
};

export const createTestReport = async (reporterId: string, reportedUserId: string, overrides = {}) => {
    const defaultReport = {
        reporter: reporterId,
        reportedUser: reportedUserId,
        reason: 'inappropriate_behavior',
        description: 'Test report description',
        status: 'pending'
    };

    const report = new ReportModel({ ...defaultReport, ...overrides });
    await report.save();
    return report;
};

export const createTestGroupChat = async (tripId: string, creatorId: string, memberIds: string[], overrides = {}) => {
    const defaultGroupChat = {
        groupChatId: `group-${tripId}-${Date.now()}`,
        trip: new mongoose.Types.ObjectId(tripId),
        createdBy: new mongoose.Types.ObjectId(creatorId),
        members: [new mongoose.Types.ObjectId(creatorId), ...memberIds.map(id => new mongoose.Types.ObjectId(id))],
        lastMessage: null,
        lastMessageAt: new Date()
    };

    const groupChat = new GroupChatModel({ ...defaultGroupChat, ...overrides });
    await groupChat.save();
    return groupChat;
};

export const cleanupTestUsers = async () => {
    await UserModel.deleteMany({});
};

export const cleanupTestTrips = async () => {
    await TripModel.deleteMany({});
};

export const cleanupTestPartnerRequests = async () => {
    await PartnerRequestModel.deleteMany({});
};

export const cleanupTestConversations = async () => {
    await ConversationModel.deleteMany({});
};

export const cleanupTestMessages = async () => {
    await MessageModel.deleteMany({});
};

export const cleanupTestNotifications = async () => {
    await NotificationModel.deleteMany({});
};

export const cleanupTestReviews = async () => {
    await ReviewModel.deleteMany({});
};

export const cleanupTestReports = async () => {
    await ReportModel.deleteMany({});
};

export const cleanupTestGroupChats = async () => {
    await GroupChatModel.deleteMany({});
};

export const cleanupAllTestData = async () => {
    await Promise.all([
        cleanupTestUsers(),
        cleanupTestTrips(),
        cleanupTestPartnerRequests(),
        cleanupTestConversations(),
        cleanupTestMessages(),
        cleanupTestNotifications(),
        cleanupTestReviews(),
        cleanupTestReports(),
        cleanupTestGroupChats()
    ]);
};
