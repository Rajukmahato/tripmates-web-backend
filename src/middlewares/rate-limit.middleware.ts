/**
 * Rate Limiting Middleware
 * Prevents brute force attacks and abuse
 */

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Global rate limiter - applied to all requests
 * 100 requests per 15 minutes
 */
export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Requests per window
    message: 'Too many requests from this IP, please try again later.',
    statusCode: 429,
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    keyGenerator: (req: Request) => {
        // Use IP address or user ID for authenticated users
        return (req as any).user?._id?.toString() || req.ip || 'unknown';
    },
    skip: (req: Request) => {
        // Skip health checks
        return req.path === '/health';
    },
});

/**
 * Strict rate limiter for authentication endpoints
 * 5 requests per 15 minutes
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 25, // Only 25 login/register attempts per IP
    message: 'Too many login attempts, please try again later.',
    statusCode: 429,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Count only failed requests
    keyGenerator: (req: Request) => req.ip || 'unknown',
});

/**
 * Strict rate limiter for API endpoints
 * 30 requests per 1 minute for authenticated users
 */
export const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 150, // Requests per window
    message: 'Too many API requests, please try again later.',
    statusCode: 429,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
        return (req as any).user?._id?.toString() || req.ip || 'unknown';
    },
});

/**
 * Chat/Message rate limiter - prevent spam
 * 50 messages per 10 minutes
 */
export const chatLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 250, // Messages per window
    message: 'Too many messages sent, please slow down.',
    statusCode: 429,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
        return (req as any).user?._id?.toString() || req.ip || 'unknown';
    },
});

/**
 * File upload rate limiter
 * 10 uploads per 1 hour
 */
export const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // Uploads per window
    message: 'Too many uploads, please try again later.',
    statusCode: 429,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
        return (req as any).user?._id?.toString() || req.ip || 'unknown';
    },
});

/**
 * Password reset rate limiter - 3 requests per hour
 */
export const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 15, // Only 15 reset requests per hour
    message: 'Too many password reset attempts, please try again later.',
    statusCode: 429,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
        // Use email if in body, otherwise IP
        return req.body?.email || req.ip || 'unknown';
    },
});

/**
 * Admin action rate limiter - prevent malicious admin actions
 * 100 requests per 5 minutes
 */
export const adminLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 500, // Admin actions per window
    message: 'Too many admin actions, please slow down.',
    statusCode: 429,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
        return (req as any).user?._id?.toString() || req.ip || 'unknown';
    },
});
