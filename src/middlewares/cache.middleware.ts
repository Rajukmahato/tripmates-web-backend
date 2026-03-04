/**
 * Redis Caching Middleware
 * Caches frequently accessed data to reduce database load
 * Implements cache-aside pattern with automatic invalidation
 */

import { Request, Response, NextFunction } from 'express';

// Redis client type (optional - only imported if ioredis is available)
let redisClient: any = null;

try {
    const Redis = require('ioredis');
    // Initialize Redis client (configure based on environment)
    redisClient = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        retryStrategy: (times: number) => Math.min(times * 50, 2000),
        enableReadyCheck: false,
        enableOfflineQueue: false,
        lazyConnect: true,
    });
} catch (error) {
    console.warn('⚠️ ioredis not installed. Cache functionality will be disabled.');
    console.warn('Install with: npm install ioredis');
}

/**
 * Cache configuration with different TTLs for different data types
 */
export const cacheConfig = {
    USER_PROFILE: 5 * 60, // 5 minutes
    USER_TRIPS: 5 * 60, // 5 minutes
    TRIP_DETAILS: 10 * 60, // 10 minutes
    TRIP_LIST: 5 * 60, // 5 minutes
    REVIEWS: 15 * 60, // 15 minutes
    NOTIFICATIONS: 2 * 60, // 2 minutes
    PARTNER_REQUESTS: 3 * 60, // 3 minutes
    ADMIN_STATS: 30 * 60, // 30 minutes (less frequent updates)
};

/**
 * Cache key generators
 */
export const cacheKeys = {
    userProfile: (userId: string) => `user:${userId}:profile`,
    userTrips: (userId: string, page: number) => `user:${userId}:trips:p${page}`,
    tripDetails: (tripId: string) => `trip:${tripId}:details`,
    tripList: (filters: string, page: number) => `trips:list:${filters}:p${page}`,
    userReviews: (userId: string) => `user:${userId}:reviews`,
    tripReviews: (tripId: string) => `trip:${tripId}:reviews`,
    notifications: (userId: string) => `user:${userId}:notifications`,
    partnerRequests: (userId: string) => `user:${userId}:partner-requests`,
    adminStats: (statType: string) => `admin:stats:${statType}`,
    groupChat: (groupChatId: string) => `groupchat:${groupChatId}:data`,
};

/**
 * Cache invalidation triggers (what to clear when data changes)
 */
export const cacheInvalidation = {
    onUserUpdate: (userId: string) => [
        cacheKeys.userProfile(userId),
        cacheKeys.userTrips(userId, 1), // Clear all pages
        cacheKeys.userReviews(userId),
    ],

    onTripCreate: (userId: string) => [
        cacheKeys.userTrips(userId, 1),
        cacheKeys.tripList('', 1), // Global trip list
    ],

    onTripUpdate: (tripId: string, creatorId: string) => [
        cacheKeys.tripDetails(tripId),
        cacheKeys.userTrips(creatorId, 1),
        cacheKeys.tripList('', 1),
    ],

    onTripDelete: (tripId: string, creatorId: string) => [
        cacheKeys.tripDetails(tripId),
        cacheKeys.userTrips(creatorId, 1),
        cacheKeys.tripList('', 1),
    ],

    onReviewCreate: (userId: string, revieweeId: string, tripId: string) => [
        cacheKeys.userReviews(userId),
        cacheKeys.userReviews(revieweeId),
        cacheKeys.tripReviews(tripId),
    ],

    onMessageCreate: (senderId: string, receiverId: string) => [
        cacheKeys.notifications(receiverId),
    ],

    onPartnerRequestStatusChange: (userId: string) => [
        cacheKeys.partnerRequests(userId),
        cacheKeys.notifications(userId), // May have new notification
    ],
};

/**
 * Get value from cache
 */
export async function getFromCache<T>(key: string): Promise<T | null> {
    try {
        if (!redisClient.status || redisClient.status === 'disconnect') {
            return null; // Redis not available
        }

        const cached = await redisClient.get(key);
        if (!cached) return null;

        return JSON.parse(cached) as T;
    } catch (error) {
        console.error(`Cache get error for key ${key}:`, error);
        return null;
    }
}

/**
 * Store value in cache with TTL
 */
export async function setInCache<T>(
    key: string,
    value: T,
    ttlSeconds?: number
): Promise<boolean> {
    try {
        if (!redisClient.status || redisClient.status === 'disconnect') {
            return false;
        }

        const data = JSON.stringify(value);
        if (ttlSeconds) {
            await redisClient.setex(key, ttlSeconds, data);
        } else {
            await redisClient.set(key, data);
        }
        return true;
    } catch (error) {
        console.error(`Cache set error for key ${key}:`, error);
        return false;
    }
}

/**
 * Delete from cache
 */
export async function deleteFromCache(keys: string | string[]): Promise<boolean> {
    try {
        if (!redisClient.status || redisClient.status === 'disconnect') {
            return false;
        }

        if (Array.isArray(keys)) {
            if (keys.length > 0) {
                await redisClient.del(...keys);
            }
        } else {
            await redisClient.del(keys);
        }
        return true;
    } catch (error) {
        console.error('Cache delete error:', error);
        return false;
    }
}

/**
 * Clear all cache (use with caution)
 */
export async function clearAllCache(): Promise<boolean> {
    try {
        if (!redisClient.status || redisClient.status === 'disconnect') {
            return false;
        }

        await redisClient.flushdb();
        return true;
    } catch (error) {
        console.error('Cache clear error:', error);
        return false;
    }
}

/**
 * Redis middleware for caching GET requests
 * Usage: app.get('/api/user/:id', cacheMiddleware('user'), userController.getUser)
 */
export function cacheMiddleware(cacheName: string, ttl?: number) {
    return async (req: Request, res: Response, next: NextFunction) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        const cacheKey = `${cacheName}:${req.originalUrl}`;

        try {
            // Try to get from cache
            const cached = await getFromCache<any>(cacheKey);
            if (cached) {
                res.set('X-Cache', 'HIT');
                return res.json(cached);
            }
        } catch (error) {
            console.warn('Cache check failed, continuing:', error);
        }

        // Store original json method
        const originalJson = res.json.bind(res);

        // Override json method to cache response
        res.json = function (body: any) {
            // Cache successful responses (status < 400)
            if (res.statusCode < 400) {
                const cacheTtl = ttl || 5 * 60; // Default 5 minutes
                setInCache(cacheKey, body, cacheTtl).catch(err =>
                    console.error('Failed to cache response:', err)
                );
                res.set('X-Cache', 'MISS');
            }

            return originalJson(body);
        };

        next();
    };
}

/**
 * Middleware to invalidate cache on mutations
 * Usage: app.put('/api/user/:id', invalidateCacheMiddleware(), userController.updateUser)
 */
export function invalidateCacheMiddleware(...keysToInvalidate: string[]) {
    return async (req: Request, res: Response, next: NextFunction) => {
        // Store original json for later
        const originalJson = res.json.bind(res);

        res.json = function (body: any) {
            // Invalidate cache on successful mutations
            if (res.statusCode < 400 && keysToInvalidate.length > 0) {
                deleteFromCache(keysToInvalidate).catch(err =>
                    console.error('Failed to invalidate cache:', err)
                );
            }

            return originalJson(body);
        };

        next();
    };
}

/**
 * Cache statistics and monitoring
 */
export async function getCacheStats() {
    try {
        if (!redisClient.status || redisClient.status === 'disconnect') {
            return null;
        }

        const info = await redisClient.info('stats');
        const keys = await redisClient.dbsize();

        return {
            connected: true,
            totalKeys: keys,
            memoryUsage: info.split('\r\n').find((l: string) => l.startsWith('used_memory_human')),
            status: redisClient.status,
        };
    } catch (error) {
        console.error('Error getting cache stats:', error);
        return { connected: false, error };
    }
}

/**
 * Connect to Redis
 */
export async function connectRedis() {
    try {
        await redisClient.connect();
        console.log('✅ Redis cache connected');

        // Test connection
        await redisClient.ping();
        console.log('✅ Redis ping successful');

        return redisClient;
    } catch (error) {
        console.error('❌ Redis connection failed:', error);
        console.log('⚠️ Running without cache - application will still work but performance will be reduced');
        return null;
    }
}

/**
 * Disconnect from Redis gracefully
 */
export async function disconnectRedis() {
    try {
        if (redisClient.status !== 'disconnect') {
            await redisClient.quit();
            console.log('✅ Redis disconnected gracefully');
        }
    } catch (error) {
        console.error('Error disconnecting Redis:', error);
    }
}

export default redisClient;
