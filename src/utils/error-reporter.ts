/**
 * Advanced Error Reporter
 * Groups similar errors, tracks patterns, and provides insights
 */

import { captureException, captureMessage, addBreadcrumb } from '../integrations/sentry';

/**
 * Error severity levels
 */
export enum ErrorSeverity {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical',
}

/**
 * Error category for grouping
 */
export enum ErrorCategory {
    AUTH = 'authentication',
    VALIDATION = 'validation',
    DATABASE = 'database',
    EXTERNAL_SERVICE = 'external_service',
    FILE_SYSTEM = 'file_system',
    NETWORK = 'network',
    BUSINESS_LOGIC = 'business_logic',
    UNKNOWN = 'unknown',
}

/**
 * Enhanced error with context
 */
export interface ErrorReport {
    id: string;
    timestamp: string;
    message: string;
    category: ErrorCategory;
    severity: ErrorSeverity;
    statusCode: number;
    userId?: string;
    requestId?: string;
    context?: Record<string, any>;
    stack?: string;
    metadata?: Record<string, any>;
}

/**
 * Error pattern matching for fingerprinting
 */
const errorPatterns: Record<string, { category: ErrorCategory; severity: ErrorSeverity }> = {
    // Authentication errors
    'jwt malformed': { category: ErrorCategory.AUTH, severity: ErrorSeverity.MEDIUM },
    'token expired': { category: ErrorCategory.AUTH, severity: ErrorSeverity.MEDIUM },
    'invalid token': { category: ErrorCategory.AUTH, severity: ErrorSeverity.MEDIUM },
    'unauthorized': { category: ErrorCategory.AUTH, severity: ErrorSeverity.MEDIUM },

    // Validation errors
    'validation error': { category: ErrorCategory.VALIDATION, severity: ErrorSeverity.LOW },
    'invalid input': { category: ErrorCategory.VALIDATION, severity: ErrorSeverity.LOW },
    'required field': { category: ErrorCategory.VALIDATION, severity: ErrorSeverity.LOW },

    // Database errors
    'econnrefused': { category: ErrorCategory.DATABASE, severity: ErrorSeverity.CRITICAL },
    'connection timeout': { category: ErrorCategory.DATABASE, severity: ErrorSeverity.CRITICAL },
    'mongodb error': { category: ErrorCategory.DATABASE, severity: ErrorSeverity.HIGH },
    'duplicate key': { category: ErrorCategory.DATABASE, severity: ErrorSeverity.MEDIUM },

    // Network errors
    'enotfound': { category: ErrorCategory.NETWORK, severity: ErrorSeverity.MEDIUM },
    'connection refused': { category: ErrorCategory.NETWORK, severity: ErrorSeverity.MEDIUM },
    'timeout': { category: ErrorCategory.NETWORK, severity: ErrorSeverity.MEDIUM },
    'socket hang up': { category: ErrorCategory.NETWORK, severity: ErrorSeverity.MEDIUM },

    // File system errors
    'enoent': { category: ErrorCategory.FILE_SYSTEM, severity: ErrorSeverity.MEDIUM },
    'eacces': { category: ErrorCategory.FILE_SYSTEM, severity: ErrorSeverity.MEDIUM },
    'file not found': { category: ErrorCategory.FILE_SYSTEM, severity: ErrorSeverity.MEDIUM },
};

/**
 * Error counter for monitoring patterns
 */
class ErrorCounter {
    private errors: Map<string, number> = new Map();
    private lastReset = Date.now();
    private readonly resetInterval = 60 * 60 * 1000; // 1 hour

    increment(key: string) {
        const count = this.errors.get(key) || 0;
        this.errors.set(key, count + 1);

        // Auto reset
        if (Date.now() - this.lastReset > this.resetInterval) {
            this.reset();
        }
    }

    get(key: string): number {
        return this.errors.get(key) || 0;
    }

    reset() {
        this.errors.clear();
        this.lastReset = Date.now();
    }

    getAll() {
        return Object.fromEntries(this.errors);
    }
}

const errorCounter = new ErrorCounter();

/**
 * Categorize error based on message
 */
function categorizeError(error: Error | string): { category: ErrorCategory; severity: ErrorSeverity } {
    const message = typeof error === 'string' ? error : error.message;
    const lowerMessage = message.toLowerCase();

    for (const [pattern, classification] of Object.entries(errorPatterns)) {
        if (lowerMessage.includes(pattern)) {
            return classification;
        }
    }

    return {
        category: ErrorCategory.UNKNOWN,
        severity: ErrorSeverity.MEDIUM,
    };
}

/**
 * Generate unique error fingerprint for grouping similar errors
 */
function generateFingerprint(error: Error, category: ErrorCategory): string {
    // Use error message + type for grouping
    const message = error.message.split('\n')[0]; // First line only
    const type = error.constructor.name;

    // Remove variable parts from message (e.g., MongoDB ObjectIds)
    const normalized = message
        .replace(/[0-9a-f]{24}/g, 'OBJECTID') // MongoDB IDs
        .replace(/\d+/g, 'NUM') // Numbers
        .replace(/https?:\/\/[^\s]+/g, 'URL'); // URLs

    return `${category}:${type}:${normalized}`;
}

/**
 * Report an error with all context
 */
export function reportError(
    error: Error | string,
    context?: {
        userId?: string;
        requestId?: string;
        statusCode?: number;
        severity?: ErrorSeverity;
        metadata?: Record<string, any>;
    }
): ErrorReport {
    const exception = typeof error === 'string' ? new Error(error) : error;
    const { category, severity: defaultSeverity } = categorizeError(exception);
    const fingerprint = generateFingerprint(exception, category);

    const report: ErrorReport = {
        id: context?.requestId || generateId(),
        timestamp: new Date().toISOString(),
        message: exception.message,
        category,
        severity: context?.severity || defaultSeverity,
        statusCode: context?.statusCode || 500,
        userId: context?.userId,
        requestId: context?.requestId,
        stack: exception.stack,
        context: context?.metadata,
        metadata: {
            fingerprint,
            errorCount: errorCounter.get(fingerprint) + 1,
        },
    };

    // Increment counter
    errorCounter.increment(fingerprint);

    // Send to Sentry with fingerprint for grouping
    captureException(exception, {
        category,
        severity: report.severity,
        userId: context?.userId,
        requestId: context?.requestId,
        statusCode: context?.statusCode,
        fingerprint: [fingerprint],
        ...context?.metadata,
    }, defaultSeverity === ErrorSeverity.CRITICAL ? 'fatal' : 'error');

    // Log locally
    logErrorReport(report);

    // Check if error is recurring
    if (report.metadata?.errorCount! > 5) {
        captureMessage(
            `Recurring error detected: ${report.message}`,
            'warning',
            {
                fingerprint,
                count: report.metadata?.errorCount,
                category,
            }
        );
    }

    return report;
}

/**
 * Report unhandled error
 */
export function reportUnhandledError(error: unknown) {
    const exception = error instanceof Error ? error : new Error(String(error));

    reportError(exception, {
        severity: ErrorSeverity.CRITICAL,
        metadata: {
            unhandled: true,
            type: error?.constructor?.name,
        },
    });
}

/**
 * Report application warning
 */
export function reportWarning(
    message: string,
    metadata?: Record<string, any>
) {
    addBreadcrumb(message, 'warning', 'warning', metadata);

    captureMessage(message, 'warning', metadata);

    logWarning(message, metadata);
}

/**
 * Report performance issue
 */
export function reportPerformanceIssue(
    operationName: string,
    durationMs: number,
    threshold: number,
    metadata?: Record<string, any>
) {
    const slowness = Math.round((durationMs / threshold) * 100);

    captureMessage(
        `Slow operation: ${operationName} took ${durationMs}ms (${slowness}% slower than threshold)`,
        'warning',
        {
            operation: operationName,
            duration: durationMs,
            threshold,
            slowness: `${slowness}%`,
            ...metadata,
        }
    );

    logPerformanceIssue(operationName, durationMs, threshold);
}

/**
 * Report security alert
 */
export function reportSecurityAlert(
    alertType: string,
    message: string,
    metadata?: Record<string, any>
) {
    captureMessage(message, 'error', {
        type: 'security',
        alertType,
        ...metadata,
    });

    logSecurityAlert(alertType, message, metadata);
}

/**
 * Get error statistics for dashboard
 */
export function getErrorStatistics() {
    return {
        errorsByType: errorCounter.getAll(),
        reportedTime: new Date().toISOString(),
    };
}

/**
 * Clear error statistics
 */
export function clearErrorStatistics() {
    errorCounter.reset();
}

/**
 * Local logging functions
 */

function generateId(): string {
    return `err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function logErrorReport(report: ErrorReport) {
    console.error(JSON.stringify({
        type: 'error_report',
        timestamp: report.timestamp,
        message: report.message,
        category: report.category,
        severity: report.severity,
        requestId: report.requestId,
        userId: report.userId,
        statusCode: report.statusCode,
        metadata: report.metadata,
    }));
}

function logWarning(message: string, metadata?: Record<string, any>) {
    console.warn(JSON.stringify({
        type: 'warning',
        timestamp: new Date().toISOString(),
        message,
        metadata,
    }));
}

function logPerformanceIssue(
    operation: string,
    durationMs: number,
    threshold: number
) {
    console.warn(JSON.stringify({
        type: 'performance_issue',
        timestamp: new Date().toISOString(),
        operation,
        durationMs,
        threshold,
        slowness: `${Math.round((durationMs / threshold) * 100)}%`,
    }));
}

function logSecurityAlert(
    alertType: string,
    message: string,
    metadata?: Record<string, any>
) {
    console.error(JSON.stringify({
        type: 'security_alert',
        timestamp: new Date().toISOString(),
        alertType,
        message,
        metadata,
    }));
}

export default {
    reportError,
    reportUnhandledError,
    reportWarning,
    reportPerformanceIssue,
    reportSecurityAlert,
    getErrorStatistics,
    clearErrorStatistics,
};
