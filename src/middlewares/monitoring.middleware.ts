/**
 * Integrated Monitoring Middleware
 * Combines performance tracking, error reporting, and alerting
 */

import { Request, Response, NextFunction } from 'express';
import { metrics } from '../utils/health-monitoring';
import { reportError, reportPerformanceIssue, reportSecurityAlert } from '../utils/error-reporter';
import { checkMetricThreshold } from '../utils/alert-system';
import { monitorAPIOperation } from '../utils/performance-monitor';
import { addBreadcrumb } from '../integrations/sentry';

/**
 * Request monitoring context
 */
interface RequestMonitoring {
    requestId: string;
    startTime: number;
    userId?: string;
    endpoint: string;
    method: string;
}

/**
 * Monitoring data attached to request
 */
declare global {
    namespace Express {
        interface Request {
            monitoring?: RequestMonitoring;
        }
    }
}

/**
 * Initialize request monitoring
 */
export function monitoringMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const requestId = (req as any).id || req.headers['x-request-id'];
    const userId = (req as any).user?.id;

    req.monitoring = {
        requestId: requestId as string,
        startTime: Date.now(),
        userId,
        endpoint: req.path,
        method: req.method,
    };

    // Track request for metrics
    const originalJson = res.json.bind(res);
    let responseBody: any;

    res.json = function (body: any) {
        responseBody = body;
        return originalJson(body);
    };

    // Finalize monitoring on response end
    res.on('finish', () => {
        finalizeMonitoring(req, res, responseBody);
    });

    next();
}

/**
 * Finalize monitoring and send alerts
 */
function finalizeMonitoring(req: Request, res: Response, responseBody: any) {
    if (!req.monitoring) return;

    const durationMs = Date.now() - req.monitoring.startTime;
    const statusCode = res.statusCode;

    // Record metrics
    metrics.recordRequest(durationMs, statusCode);

    // Check thresholds
    checkMetricThreshold('responseTime', durationMs);
    checkMetricThreshold('errorRate', (metrics as any).getMetrics().errorRatePercent);

    // Add breadcrumb to Sentry
    addBreadcrumb(
        `${req.monitoring.method} ${req.monitoring.endpoint}`,
        'http',
        statusCode >= 400 ? 'error' : 'info',
        {
            statusCode,
            durationMs,
            userId: req.monitoring.userId,
        }
    );

    // Handle errors
    if (statusCode >= 500) {
        // Log actual error details for debugging
        console.error(`❌ Server error on ${req.monitoring.method} ${req.monitoring.endpoint}:`, {
            statusCode,
            responseBody,
            durationMs,
            userId: req.monitoring.userId,
        });
        
        reportError(
            new Error(`Server error: ${req.monitoring.method} ${req.monitoring.endpoint}`),
            {
                statusCode,
                requestId: req.monitoring.requestId,
                userId: req.monitoring.userId,
                metadata: {
                    endpoint: req.monitoring.endpoint,
                    method: req.monitoring.method,
                    durationMs,
                    responseBody: responseBody?.success === false ? responseBody?.message : responseBody?.error,
                },
            }
        );
    }

    // Report slow requests
    if (durationMs > 1000) {
        reportPerformanceIssue(
            `${req.monitoring.method} ${req.monitoring.endpoint}`,
            durationMs,
            1000,
            {
                requestId: req.monitoring.requestId,
                userId: req.monitoring.userId,
                statusCode,
            }
        );
    }

    // Detect suspicious activity
    detectSuspiciousActivity(req, durationMs, statusCode);
}

/**
 * Detect suspicious patterns
 */
function detectSuspiciousActivity(
    req: Request,
    durationMs: number,
    statusCode: number
) {
    // Possible brute force attack
    if (req.path.includes('/auth/login') && statusCode === 401) {
        // Track failed login attempts per IP
        const clientIp = req.ip || 'unknown';
        const key = `failed-login:${clientIp}`;

        // In production, use Redis to track this
        reportSecurityAlert(
            'SUSPICIOUS_AUTH_ATTEMPT',
            `Failed authentication attempt from ${clientIp}`,
            {
                endpoint: req.path,
                method: req.method,
                ip: clientIp,
                userAgent: req.headers['user-agent'],
            }
        );
    }

    // Possible SQL/NoSQL injection
    if (statusCode === 400 || statusCode === 422) {
        const paramString = JSON.stringify(req.query) + JSON.stringify(req.body);
        const suspiciousPatterns = ['$ne', '$gt', '$lt', '$(javascript)', 'exec(', 'eval('];

        for (const pattern of suspiciousPatterns) {
            if (paramString.includes(pattern)) {
                reportSecurityAlert(
                    'POSSIBLE_INJECTION_ATTEMPT',
                    `Detected possible injection pattern: ${pattern}`,
                    {
                        endpoint: req.path,
                        pattern,
                        ip: req.ip,
                    }
                );
                break;
            }
        }
    }

    // Possible path traversal
    if (req.path.includes('..') || req.path.includes('//')) {
        reportSecurityAlert(
            'PATH_TRAVERSAL_ATTEMPT',
            `Path traversal attempt: ${req.path}`,
            {
                ip: req.ip,
                originalUrl: req.originalUrl,
            }
        );
    }
}

/**
 * Error handler for monitoring
 */
export function errorMonitoringHandler(
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
) {
    const statusCode = (error as any).statusCode || 500;
    const requestId = (req as any).id;

    // Report the error
    reportError(error, {
        statusCode,
        requestId,
        userId: (req as any).user?.id,
        metadata: {
            endpoint: req.path,
            method: req.method,
            ip: req.ip,
        },
    });

    // Don't call next - error is handled
}

/**
 * Unhandled rejection handler
 */
export function setupUnhandledRejectionHandler() {
    process.on('unhandledRejection', (reason: any) => {
        const error = reason instanceof Error ? reason : new Error(String(reason));

        reportError(error, {
            statusCode: 500,
            severity: 'critical' as any,
            metadata: {
                type: 'unhandledRejection',
                reason,
            },
        });

        // Log for debugging
        console.error('❌ Unhandled Promise Rejection:', error);
    });
}

/**
 * Uncaught exception handler
 */
export function setupUncaughtExceptionHandler() {
    process.on('uncaughtException', (error: Error) => {
        reportError(error, {
            statusCode: 500,
            severity: 'critical' as any,
            metadata: {
                type: 'uncaughtException',
            },
        });

        // Log for debugging
        console.error('❌ Uncaught Exception:', error);

        // In production, exit gracefully after reporting
        if (process.env.NODE_ENV === 'production') {
            console.log('Exiting due to uncaught exception...');
            process.exit(1);
        }
    });
}

/**
 * Setup all monitoring handlers
 */
export function setupMonitoring(app: any) {
    // Add request monitoring middleware early in the chain
    app.use(monitoringMiddleware);

    // Setup process error handlers
    setupUnhandledRejectionHandler();
    setupUncaughtExceptionHandler();

    // Add error monitoring handler at the end
    app.use(errorMonitoringHandler);
}

export default {
    monitoringMiddleware,
    errorMonitoringHandler,
    setupUnhandledRejectionHandler,
    setupUncaughtExceptionHandler,
    setupMonitoring,
};
