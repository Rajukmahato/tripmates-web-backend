/**
 * Request/Response Logging & Security Headers Middleware
 * Logs all incoming requests and adds security headers
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

interface RequestLog {
    timestamp: string;
    requestId: string;
    method: string;
    path: string;
    statusCode: number;
    duration: number;
    userId?: string;
    ip: string;
    userAgent?: string;
}

/**
 * Request ID generator middleware
 * Generates unique ID for each request for tracking and debugging
 */
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const requestId = req.headers['x-request-id'] as string || uuidv4();
    (req as any).requestId = requestId;
    res.setHeader('X-Request-ID', requestId);
    next();
};

/**
 * Logger middleware
 * Logs request/response details for debugging and monitoring
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const originalSend = res.send;

    // Intercept response send
    res.send = function (data: any) {
        const duration = Date.now() - startTime;
        const statusCode = res.statusCode;
        const userId = (req as any).user?._id || 'anonymous';
        const requestId = (req as any).requestId;

        const logEntry: RequestLog = {
            timestamp: new Date().toISOString(),
            requestId,
            method: req.method,
            path: req.path,
            statusCode,
            duration,
            userId,
            ip: req.ip || 'unknown',
            userAgent: req.get('user-agent'),
        };

        // Log based on status code
        if (statusCode >= 500) {
            console.error('🔴 SERVER ERROR:', logEntry);
        } else if (statusCode >= 400) {
            console.warn('🟡 CLIENT ERROR:', logEntry);
        } else if (statusCode >= 200 && statusCode < 300) {
            console.info('✅ SUCCESS:', logEntry);
        } else {
            console.info('ℹ️ INFO:', logEntry);
        }

        return originalSend.call(this, data);
    };

    next();
};

/**
 * Enhanced security headers middleware
 * Adds comprehensive security headers to all responses
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
    // Prevent clickjacking attacks
    res.setHeader('X-Frame-Options', 'DENY');

    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Enable XSS protection in older browsers
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Strict Transport Security (HSTS)
    // Forces HTTPS connections for 30 days
    res.setHeader('Strict-Transport-Security', 'max-age=2592000; includeSubDomains; preload');

    // Referrer Policy - don't send referrer to third parties
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Content Security Policy - strict policy
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' wss: ws:; media-src 'self'; object-src 'none'; frame-ancestors 'none';"
    );

    // Permissions Policy (formerly Feature Policy)
    res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');

    // Remove server version header
    res.removeHeader('X-Powered-By');
    res.setHeader('X-Powered-By', 'TripMates API');

    // Don't cache sensitive responses
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    next();
};
