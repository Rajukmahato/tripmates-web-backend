/**
 * Performance Monitoring & APM
 * Tracks operation durations, identifies bottlenecks, and reports slow queries
 */

import { reportPerformanceIssue } from './error-reporter';
import { captureMessage } from '../integrations/sentry';

/**
 * Performance thresholds for different operations
 */
export const performanceThresholds = {
    DATABASE_QUERY: 100, // ms
    CACHE_OPERATION: 10, // ms
    API_ENDPOINT: 200, // ms
    EXTERNAL_SERVICE: 1000, // ms
    FILE_OPERATION: 500, // ms
    BATCH_OPERATION: 5000, // ms (for bulk operations)
};

/**
 * Operation performance metrics
 */
export interface OperationMetrics {
    name: string;
    operation: string;
    durationMs: number;
    timestamp: string;
    slow: boolean;
    threshold: number;
    metadata?: Record<string, any>;
}

/**
 * Performance tracking data
 */
class PerformanceTracker {
    private operations: OperationMetrics[] = [];
    private maxSamples = 1000;

    record(metrics: OperationMetrics) {
        this.operations.push(metrics);

        // Keep only recent samples
        if (this.operations.length > this.maxSamples) {
            this.operations.shift();
        }

        // Report if slow
        if (metrics.slow) {
            reportPerformanceIssue(metrics.name, metrics.durationMs, metrics.threshold, {
                operation: metrics.operation,
                ...metrics.metadata,
            });
        }
    }

    getMetrics(operation?: string) {
        let filtered = this.operations;

        if (operation) {
            filtered = filtered.filter(m => m.operation === operation);
        }

        const count = filtered.length;
        if (count === 0) return null;

        const durations = filtered.map(m => m.durationMs);
        const sum = durations.reduce((a, b) => a + b, 0);
        const slowCount = filtered.filter(m => m.slow).length;

        return {
            count,
            avgDuration: Math.round(sum / count),
            minDuration: Math.min(...durations),
            maxDuration: Math.max(...durations),
            slowCount,
            slowPercentage: Math.round((slowCount / count) * 100),
            p95Duration: durations.sort((a, b) => a - b)[Math.floor(count * 0.95)],
            p99Duration: durations.sort((a, b) => a - b)[Math.floor(count * 0.99)],
        };
    }

    getAll() {
        return {
            database: this.getMetrics('database'),
            cache: this.getMetrics('cache'),
            api: this.getMetrics('api'),
            externalService: this.getMetrics('external_service'),
            file: this.getMetrics('file'),
            batch: this.getMetrics('batch'),
            all: this.getMetrics(),
        };
    }

    reset() {
        this.operations = [];
    }
}

const tracker = new PerformanceTracker();

/**
 * Monitor a database query
 */
export async function monitorDatabaseQuery<T>(
    operationName: string,
    queryFn: () => Promise<T>,
    metadata?: Record<string, any>
): Promise<T> {
    const startTime = Date.now();

    try {
        const result = await queryFn();
        const durationMs = Date.now() - startTime;
        const slow = durationMs > performanceThresholds.DATABASE_QUERY;

        tracker.record({
            name: operationName,
            operation: 'database',
            durationMs,
            timestamp: new Date().toISOString(),
            slow,
            threshold: performanceThresholds.DATABASE_QUERY,
            metadata: { ...metadata, result: 'success' },
        });

        return result;
    } catch (error) {
        const durationMs = Date.now() - startTime;

        tracker.record({
            name: operationName,
            operation: 'database',
            durationMs,
            timestamp: new Date().toISOString(),
            slow: true,
            threshold: performanceThresholds.DATABASE_QUERY,
            metadata: { ...metadata, result: 'error', error: (error as Error).message },
        });

        throw error;
    }
}

/**
 * Monitor a cache operation
 */
export async function monitorCacheOperation<T>(
    operationName: string,
    operationFn: () => Promise<T>,
    metadata?: Record<string, any>
): Promise<T> {
    const startTime = Date.now();

    try {
        const result = await operationFn();
        const durationMs = Date.now() - startTime;
        const slow = durationMs > performanceThresholds.CACHE_OPERATION;

        tracker.record({
            name: operationName,
            operation: 'cache',
            durationMs,
            timestamp: new Date().toISOString(),
            slow,
            threshold: performanceThresholds.CACHE_OPERATION,
            metadata: { ...metadata, result: 'success' },
        });

        return result;
    } catch (error) {
        const durationMs = Date.now() - startTime;

        tracker.record({
            name: operationName,
            operation: 'cache',
            durationMs,
            timestamp: new Date().toISOString(),
            slow: true,
            threshold: performanceThresholds.CACHE_OPERATION,
            metadata: { ...metadata, result: 'error', error: (error as Error).message },
        });

        throw error;
    }
}

/**
 * Monitor an API endpoint
 */
export async function monitorAPIOperation<T>(
    endpoint: string,
    operationFn: () => Promise<T>,
    metadata?: Record<string, any>
): Promise<T> {
    const startTime = Date.now();

    try {
        const result = await operationFn();
        const durationMs = Date.now() - startTime;
        const slow = durationMs > performanceThresholds.API_ENDPOINT;

        tracker.record({
            name: endpoint,
            operation: 'api',
            durationMs,
            timestamp: new Date().toISOString(),
            slow,
            threshold: performanceThresholds.API_ENDPOINT,
            metadata: { ...metadata, result: 'success' },
        });

        return result;
    } catch (error) {
        const durationMs = Date.now() - startTime;

        tracker.record({
            name: endpoint,
            operation: 'api',
            durationMs,
            timestamp: new Date().toISOString(),
            slow: true,
            threshold: performanceThresholds.API_ENDPOINT,
            metadata: { ...metadata, result: 'error', error: (error as Error).message },
        });

        throw error;
    }
}

/**
 * Monitor external service call
 */
export async function monitorExternalService<T>(
    serviceName: string,
    operationFn: () => Promise<T>,
    metadata?: Record<string, any>
): Promise<T> {
    const startTime = Date.now();

    try {
        const result = await operationFn();
        const durationMs = Date.now() - startTime;
        const slow = durationMs > performanceThresholds.EXTERNAL_SERVICE;

        tracker.record({
            name: serviceName,
            operation: 'external_service',
            durationMs,
            timestamp: new Date().toISOString(),
            slow,
            threshold: performanceThresholds.EXTERNAL_SERVICE,
            metadata: { ...metadata, result: 'success' },
        });

        return result;
    } catch (error) {
        const durationMs = Date.now() - startTime;

        tracker.record({
            name: serviceName,
            operation: 'external_service',
            durationMs,
            timestamp: new Date().toISOString(),
            slow: true,
            threshold: performanceThresholds.EXTERNAL_SERVICE,
            metadata: { ...metadata, result: 'error', error: (error as Error).message },
        });

        throw error;
    }
}

/**
 * Monitor file operation
 */
export async function monitorFileOperation<T>(
    operationName: string,
    operationFn: () => Promise<T>,
    metadata?: Record<string, any>
): Promise<T> {
    const startTime = Date.now();

    try {
        const result = await operationFn();
        const durationMs = Date.now() - startTime;
        const slow = durationMs > performanceThresholds.FILE_OPERATION;

        tracker.record({
            name: operationName,
            operation: 'file',
            durationMs,
            timestamp: new Date().toISOString(),
            slow,
            threshold: performanceThresholds.FILE_OPERATION,
            metadata: { ...metadata, result: 'success' },
        });

        return result;
    } catch (error) {
        const durationMs = Date.now() - startTime;

        tracker.record({
            name: operationName,
            operation: 'file',
            durationMs,
            timestamp: new Date().toISOString(),
            slow: true,
            threshold: performanceThresholds.FILE_OPERATION,
            metadata: { ...metadata, result: 'error', error: (error as Error).message },
        });

        throw error;
    }
}

/**
 * Monitor batch operation
 */
export async function monitorBatchOperation<T>(
    operationName: string,
    operationFn: () => Promise<T>,
    itemCount: number,
    metadata?: Record<string, any>
): Promise<T> {
    const startTime = Date.now();

    try {
        const result = await operationFn();
        const durationMs = Date.now() - startTime;
        const slow = durationMs > performanceThresholds.BATCH_OPERATION;

        tracker.record({
            name: operationName,
            operation: 'batch',
            durationMs,
            timestamp: new Date().toISOString(),
            slow,
            threshold: performanceThresholds.BATCH_OPERATION,
            metadata: {
                ...metadata,
                itemCount,
                timePerItem: Math.round(durationMs / itemCount),
                result: 'success',
            },
        });

        return result;
    } catch (error) {
        const durationMs = Date.now() - startTime;

        tracker.record({
            name: operationName,
            operation: 'batch',
            durationMs,
            timestamp: new Date().toISOString(),
            slow: true,
            threshold: performanceThresholds.BATCH_OPERATION,
            metadata: {
                ...metadata,
                itemCount,
                result: 'error',
                error: (error as Error).message,
            },
        });

        throw error;
    }
}

/**
 * Get performance metrics for dashboard
 */
export function getPerformanceMetrics() {
    return tracker.getAll();
}

/**
 * Reset performance metrics
 */
export function resetPerformanceMetrics() {
    tracker.reset();
}

/**
 * Decorator for monitoring async functions
 */
export function MonitorPerformance(
    operationType: keyof typeof performanceThresholds = 'API_ENDPOINT'
) {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            const operationName = `${target.constructor.name}.${propertyKey}`;
            const threshold = performanceThresholds[operationType];

            const startTime = Date.now();

            try {
                const result = await originalMethod.apply(this, args);
                const durationMs = Date.now() - startTime;

                tracker.record({
                    name: operationName,
                    operation: operationType.toLowerCase().replace(/_/g, '_'),
                    durationMs,
                    timestamp: new Date().toISOString(),
                    slow: durationMs > threshold,
                    threshold,
                });

                return result;
            } catch (error) {
                const durationMs = Date.now() - startTime;

                tracker.record({
                    name: operationName,
                    operation: operationType.toLowerCase().replace(/_/g, '_'),
                    durationMs,
                    timestamp: new Date().toISOString(),
                    slow: true,
                    threshold,
                    metadata: { error: (error as Error).message },
                });

                throw error;
            }
        };

        return descriptor;
    };
}

export default {
    monitorDatabaseQuery,
    monitorCacheOperation,
    monitorAPIOperation,
    monitorExternalService,
    monitorFileOperation,
    monitorBatchOperation,
    getPerformanceMetrics,
    resetPerformanceMetrics,
    MonitorPerformance,
};
