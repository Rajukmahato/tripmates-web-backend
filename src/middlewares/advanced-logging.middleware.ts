/**
 * Advanced Request/Response Logging Middleware
 * Tracks all requests with detailed metrics and performance data
 * Integrates with monitoring systems
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Request metadata stored on req object
 */
export interface RequestMetadata {
    requestId: string;
    startTime: number;
    method: string;
    path: string;
    userAgent: string;
    ipAddress: string;
    userId?: string;
}

/**
 * Response metrics
 */
export interface ResponseMetrics {
    statusCode: number;
    durationMs: number;
    contentLength: number;
    cacheStatus?: 'HIT' | 'MISS' | 'NONE';
    errorMessage?: string;
}

/**
 * Log levels for different severity
 */
export enum LogLevel {
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR',
    CRITICAL = 'CRITICAL',
}

/**
 * Structured log entry
 */
export interface LogEntry {
    timestamp: string;
    requestId: string;
    level: LogLevel;
    module: string;
    message: string;
    metadata?: Record<string, any>;
    error?: {
        message: string;
        stack?: string;
        code?: string;
    };
}

/**
 * Request logging middleware - captures request metadata
 */
export function requestLoggingMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const requestId = req.headers['x-request-id'] as string || uuidv4();
    const startTime = Date.now();

    // Store metadata on request
    (req as any).id = requestId;
    
    // Extract IP address
    const ipAddress = req.ip ||
        req.headers['x-forwarded-for'] as string ||
        req.socket.remoteAddress ||
        'unknown';

    const metadata: RequestMetadata = {
        requestId,
        startTime,
        method: req.method,
        path: req.path,
        userAgent: req.headers['user-agent'] || 'unknown',
        ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
        userId: (req as any).user?.id,
    };

    // Store metadata
    (req as any).metadata = metadata;

    // Capture response metrics
    const originalJson = res.json.bind(res);
    let responseBody: any;

    res.json = function (body: any) {
        responseBody = body;
        return originalJson(body);
    };

    // Log on response finish
    res.on('finish', () => {
        const durationMs = Date.now() - startTime;
        const cacheStatus = res.getHeader('X-Cache') as string;

        const metrics: ResponseMetrics = {
            statusCode: res.statusCode,
            durationMs,
            contentLength: parseInt(res.getHeader('content-length') as string) || 0,
            cacheStatus: cacheStatus as any,
        };

        // Extract error from response if present
        if (res.statusCode >= 400 && responseBody?.error) {
            metrics.errorMessage = responseBody.error.message;
        }

        // Log request completion
        logRequest(metadata, metrics);

        // Alert on slow queries (>1 second)
        if (durationMs > 1000) {
            logPerformanceAlert(requestId, {
                path: req.path,
                method: req.method,
                durationMs,
                statusCode: res.statusCode,
            });
        }

        // Alert on errors
        if (res.statusCode >= 500) {
            logError(requestId, new Error(metrics.errorMessage || 'Internal Server Error'), {
                path: req.path,
                statusCode: res.statusCode,
            });
        }
    });

    next();
}

/**
 * Log a completed request
 */
function logRequest(metadata: RequestMetadata, metrics: ResponseMetrics) {
    const logLevel = getLogMevelForStatus(metrics.statusCode);

    const logEntry: LogEntry = {
        timestamp: new Date().toISOString(),
        requestId: metadata.requestId,
        level: logLevel,
        module: 'HTTP',
        message: `${metadata.method} ${metadata.path}`,
        metadata: {
            method: metadata.method,
            path: metadata.path,
            statusCode: metrics.statusCode,
            durationMs: metrics.durationMs,
            ipAddress: metadata.ipAddress,
            userAgent: metadata.userAgent,
            userId: metadata.userId,
            cacheStatus: metrics.cacheStatus,
            contentLength: metrics.contentLength,
        },
    };

    // Implement your logging backend here
    console.log(JSON.stringify(logEntry));

    // Could also send to:
    // - LogStash/ELK stack
    // - DataDog
    // - New Relic
    // - CloudWatch
    // - File system
}

/**
 * Log performance alert
 */
function logPerformanceAlert(
    requestId: string,
    details: {
        path: string;
        method: string;
        durationMs: number;
        statusCode: number;
    }
) {
    const logEntry: LogEntry = {
        timestamp: new Date().toISOString(),
        requestId,
        level: LogLevel.WARN,
        module: 'PERFORMANCE',
        message: `Slow query detected: ${details.method} ${details.path} took ${details.durationMs}ms`,
        metadata: details,
    };

    console.warn(JSON.stringify(logEntry));

    // Alert monitoring system
    // alertMonitoringSystem('slow-request', details);
}

/**
 * Log errors
 */
function logError(
    requestId: string,
    error: Error,
    context?: Record<string, any>
) {
    const logEntry: LogEntry = {
        timestamp: new Date().toISOString(),
        requestId,
        level: LogLevel.ERROR,
        module: 'ERROR_HANDLER',
        message: error.message,
        metadata: context,
        error: {
            message: error.message,
            stack: error.stack,
            code: (error as any).code,
        },
    };

    console.error(JSON.stringify(logEntry));

    // Send to error tracking service
    // sendToSentry(logEntry);
}

/**
 * Determine log level based on HTTP status code
 */
function getLogMevelForStatus(statusCode: number): LogLevel {
    if (statusCode < 300) return LogLevel.INFO;
    if (statusCode < 400) return LogLevel.INFO;
    if (statusCode < 500) return LogLevel.WARN;
    if (statusCode < 600) return LogLevel.ERROR;
    return LogLevel.CRITICAL;
}

/**
 * Custom logger for application code
 */
export class Logger {
    private requestId?: string;
    private module: string;

    constructor(module: string, requestId?: string) {
        this.module = module;
        this.requestId = requestId;
    }

    info(message: string, metadata?: Record<string, any>) {
        this.log(LogLevel.INFO, message, metadata);
    }

    debug(message: string, metadata?: Record<string, any>) {
        this.log(LogLevel.DEBUG, message, metadata);
    }

    warn(message: string, metadata?: Record<string, any>) {
        this.log(LogLevel.WARN, message, metadata);
    }

    error(message: string, error?: Error, metadata?: Record<string, any>) {
        this.logError(LogLevel.ERROR, message, error, metadata);
    }

    critical(message: string, error?: Error, metadata?: Record<string, any>) {
        this.logError(LogLevel.CRITICAL, message, error, metadata);
    }

    private log(level: LogLevel, message: string, metadata?: Record<string, any>) {
        const logEntry: LogEntry = {
            timestamp: new Date().toISOString(),
            requestId: this.requestId || 'NO_REQUEST_ID',
            level,
            module: this.module,
            message,
            metadata,
        };

        console.log(JSON.stringify(logEntry));
    }

    private logError(
        level: LogLevel,
        message: string,
        error?: Error,
        metadata?: Record<string, any>
    ) {
        const logEntry: LogEntry = {
            timestamp: new Date().toISOString(),
            requestId: this.requestId || 'NO_REQUEST_ID',
            level,
            module: this.module,
            message,
            metadata,
            error: error ? {
                message: error.message,
                stack: error.stack,
                code: (error as any).code,
            } : undefined,
        };

        if (level === LogLevel.ERROR) {
            console.error(JSON.stringify(logEntry));
        } else {
            console.error(JSON.stringify(logEntry));
        }
    }
}

/**
 * Extract logger from request
 */
export function getLoggerFromRequest(req: Request, module: string): Logger {
    const requestId = (req as any).metadata?.requestId || (req as any).id;
    return new Logger(module, requestId);
}

/**
 * Request ID extractor for middleware chain
 */
export function requestIdMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const requestId = req.headers['x-request-id'] as string || uuidv4();
    (req as any).id = requestId;
    res.setHeader('X-Request-ID', requestId);
    next();
}
