/**
 * Database Schema Optimization Recommendations
 * Index definitions and best practices
 */

/**
 * Recommended indexes for each collection
 * Add these to improve query performance
 */
export const recommendedIndexes = {
    users: [
        { fields: { email: 1 }, unique: true, name: 'email_unique' },
        { fields: { phoneNumber: 1 }, unique: true, name: 'phone_unique' },
        { fields: { createdAt: -1 }, name: 'created_desc' },
        { fields: { role: 1 }, name: 'role_filter' },
    ],

    trips: [
        { fields: { creator: 1 }, name: 'creator_index' },
        { fields: { status: 1 }, name: 'status_filter' },
        { fields: { startDate: 1, endDate: 1 }, name: 'date_range' },
        { fields: { budget: 1 }, name: 'budget_filter' },
        { fields: { destination: 'text', description: 'text' }, name: 'text_search' },
        { fields: { createdAt: -1 }, name: 'created_desc' },
        { fields: { 'members.0': 1 }, name: 'has_members' },
    ],

    messages: [
        { fields: { sender: 1, receiver: 1 }, name: 'conversation' },
        { fields: { createdAt: -1 }, name: 'created_desc' },
        { fields: { read: 1, receiver: 1 }, name: 'unread_messages' },
    ],

    partnerRequests: [
        { fields: { sender: 1, receiver: 1 }, name: 'users_composite' },
        { fields: { trip: 1, sender: 1 }, name: 'trip_sender' },
        { fields: { status: 1 }, name: 'status_filter' },
        { fields: { createdAt: -1 }, name: 'created_desc' },
    ],

    reviews: [
        { fields: { reviewer: 1, reviewee: 1 }, name: 'reviewer_reviewee' },
        { fields: { trip: 1 }, name: 'trip_reviews' },
        { fields: { createdAt: -1 }, name: 'created_desc' },
        { fields: { rating: -1 }, name: 'rating_desc' },
    ],

    notifications: [
        { fields: { recipient: 1 }, name: 'recipient_index' },
        { fields: { read: 1, recipient: 1 }, name: 'unread_notification' },
        { fields: { createdAt: -1 }, name: 'created_desc' },
        { fields: { type: 1 }, name: 'type_filter' },
    ],

    groupChats: [
        { fields: { groupChatId: 1 }, unique: true, name: 'groupchat_id' },
        { fields: { trip: 1 }, name: 'trip_ref' },
        { fields: { 'members.0': 1 }, name: 'has_members' },
    ],

    reports: [
        { fields: { status: 1 }, name: 'status_filter' },
        { fields: { reporter: 1 }, name: 'reporter_index' },
        { fields: { createdAt: -1 }, name: 'created_desc' },
    ],
};

/**
 * TTL (Time To Live) Index Configuration
 * Automatically delete records after expiration
 */
export const ttlIndexes = {
    // Clear read notifications after 30 days
    notifications: {
        field: 'createdAt',
        expireAfterSeconds: 60 * 60 * 24 * 30, // 30 days
        condition: { read: true }, // Only for read notifications
    },

    // Clear reset tokens after 24 hours
    users: {
        field: 'resetPasswordExpires',
        expireAfterSeconds: 0, // Expire at exact time specified
    },
};

/**
 * Add indexes to schema
 * Run this during development/testing setup
 */
export async function ensureIndexes(models: any) {
    try {
        console.log('🔍 Ensuring database indexes...');

        for (const [modelName, indexes] of Object.entries(recommendedIndexes)) {
            const model = models[modelName];
            if (!model) {
                console.warn(`⚠️ Model not found: ${modelName}`);
                continue;
            }

            for (const index of indexes as any[]) {
                try {
                    await model.collection.ensureIndex(index.fields, {
                        name: index.name,
                        unique: index.unique,
                        background: true, // Don't lock the database
                    });
                    console.log(`✅ Index ensured: ${modelName}.${index.name}`);
                } catch (error: any) {
                    if (error.code !== 85) { // Index already exists
                        console.error(`❌ Error creating index ${modelName}.${index.name}:`, error);
                    }
                }
            }
        }

        console.log('✅ All indexes processed');
    } catch (error) {
        console.error('❌ Index setup error:', error);
    }
}

/**
 * Get index statistics for performance analysis
 */
export async function getIndexStatistics(model: any) {
    try {
        const stats = await model.collection.aggregate([
            { $indexStats: {} }
        ]).toArray();

        return stats.map((stat: any) => ({
            name: stat.name,
            accesses: stat.accesses.ops,
            keys: stat.key,
            since: stat.accesses.since,
        }));
    } catch (error) {
        console.error('Error getting index statistics:', error);
        return [];
    }
}

/**
 * Query execution optimization tips
 */
export const queryOptimizationTips = {
    1: 'Always paginate large result sets',
    2: 'Use select() to retrieve only needed fields',
    3: 'Use lean() for read-only queries (faster)',
    4: 'Add indexes on frequently queried fields',
    5: 'Use aggregation framework for complex queries',
    6: 'Avoid N+1 queries - use populate() wisely',
    7: 'Set appropriate connection pool limits',
    8: 'Monitor slow queries (>1s execution time)',
    9: 'Use transactions for related writes',
    10: 'Consider denormalization for frequently joined data',
};

/**
 * Database backup strategy
 * Recommended configuration for MongoDB backups
 */
export const backupStrategy = {
    frequency: 'Hourly',
    type: 'Incremental backup',
    retention: '30 days',
    method: 'mongodump with --oplog for point-in-time restore',
    command: 'mongodump --uri "mongodb://..." --out ./backups/$(date +%Y%m%d_%H%M%S) --oplog',
    restore: 'mongorestore --uri "mongodb://..." ./backups/DIR/ --oplogReplay',
};
