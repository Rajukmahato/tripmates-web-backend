/**
 * System Health Monitoring
 * Monitors database, cache, queue, and API health
 * Provides metrics and alerts for infrastructure
 */

import mongoose from 'mongoose';
import { Request, Response } from 'express';

// Import cache stats function - only if cache is available
let getCacheStats: any = null;
try {
    const cacheModule = require('../middlewares/cache.middleware');
    getCacheStats = cacheModule.getCacheStats;
} catch (e) {
    // Cache module not available
}

/**
 * Health check status enum
 */
export enum HealthStatus {
    UP = 'UP',
    DEGRADED = 'DEGRADED',
    DOWN = 'DOWN',
}

/**
 * Individual component health
 */
export interface ComponentHealth {
    name: string;
    status: HealthStatus;
    responseTimeMs: number;
    lastChecked: string;
    details?: Record<string, any>;
    error?: string;
}

/**
 * Overall system health
 */
export interface SystemHealth {
    status: HealthStatus;
    timestamp: string;
    uptime: number;
    components: ComponentHealth[];
    metrics: {
        requestsPerMinute: number;
        errorRatePercent: number;
        avgResponseTimeMs: number;
        activeConnections: number;
    };
}

/**
 * Metrics tracking
 */
class HealthMetrics {
    private startTime = Date.now();
    private requestCount = 0;
    private errorCount = 0;
    private responseTimes: number[] = [];
    private maxSamples = 1000;

    recordRequest(durationMs: number, statusCode: number) {
        this.requestCount++;
        this.responseTimes.push(durationMs);

        // Keep only last N samples for memory efficiency
        if (this.responseTimes.length > this.maxSamples) {
            this.responseTimes.shift();
        }

        if (statusCode >= 400) {
            this.errorCount++;
        }
    }

    getMetrics() {
        const uptime = (Date.now() - this.startTime) / 1000 / 60; // minutes
        const requestsPerMinute = uptime > 0 ? this.requestCount / uptime : 0;
        const errorRatePercent = this.requestCount > 0
            ? (this.errorCount / this.requestCount) * 100
            : 0;
        const avgResponseTimeMs = this.responseTimes.length > 0
            ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
            : 0;

        return {
            requestsPerMinute: Math.round(requestsPerMinute),
            errorRatePercent: Math.round(errorRatePercent * 100) / 100,
            avgResponseTimeMs: Math.round(avgResponseTimeMs),
            totalRequests: this.requestCount,
            totalErrors: this.errorCount,
            uptime: Math.round(uptime),
        };
    }

    reset() {
        this.startTime = Date.now();
        this.requestCount = 0;
        this.errorCount = 0;
        this.responseTimes = [];
    }
}

export const metrics = new HealthMetrics();

/**
 * Check database health
 */
async function checkDatabaseHealth(): Promise<ComponentHealth> {
    const startTime = Date.now();

    try {
        // Ping database
        const client = mongoose.connection.getClient();
        if (client && (client as any).admin) {
            await (client as any).admin().ping();
        }

        const responseTime = Date.now() - startTime;
        const collections = mongoose.connection.collections;
        const models = Object.keys(collections);

        return {
            name: 'Database',
            status: responseTime < 200 ? HealthStatus.UP : HealthStatus.DEGRADED,
            responseTimeMs: responseTime,
            lastChecked: new Date().toISOString(),
            details: {
                server: (client as any)?.topology?.description?.servers?.[0]?.address || 'unknown',
                database: mongoose.connection.name,
                collections: models.length,
                connectionState: mongoose.connection.readyState,
            },
        };
    } catch (error) {
        return {
            name: 'Database',
            status: HealthStatus.DOWN,
            responseTimeMs: Date.now() - startTime,
            lastChecked: new Date().toISOString(),
            error: (error as Error).message,
        };
    }
}

/**
 * Check cache health
 */
async function checkCacheHealth(): Promise<ComponentHealth> {
    const startTime = Date.now();

    try {
        if (!getCacheStats) {
            return {
                name: 'Cache',
                status: HealthStatus.DOWN,
                responseTimeMs: 0,
                lastChecked: new Date().toISOString(),
                error: 'Cache module not available',
            };
        }

        const stats = await getCacheStats();
        const responseTime = Date.now() - startTime;

        if (!stats || !stats.connected) {
            return {
                name: 'Cache',
                status: HealthStatus.DOWN,
                responseTimeMs: responseTime,
                lastChecked: new Date().toISOString(),
                error: 'Redis connection failed',
            };
        }

        return {
            name: 'Cache',
            status: responseTime < 100 ? HealthStatus.UP : HealthStatus.DEGRADED,
            responseTimeMs: responseTime,
            lastChecked: new Date().toISOString(),
            details: {
                totalKeys: stats.totalKeys,
                memoryUsage: stats.memoryUsage,
                status: stats.status,
            },
        };
    } catch (error) {
        return {
            name: 'Cache',
            status: HealthStatus.DOWN,
            responseTimeMs: Date.now() - startTime,
            lastChecked: new Date().toISOString(),
            error: (error as Error).message,
        };
    }
}

/**
 * Check memory health
 */
function checkMemoryHealth(): ComponentHealth {
    try {
        const memUsage = process.memoryUsage();
        const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

        let status = HealthStatus.UP;
        if (heapUsedPercent > 85) {
            status = HealthStatus.DEGRADED;
        } else if (heapUsedPercent > 95) {
            status = HealthStatus.DOWN;
        }

        return {
            name: 'Memory',
            status,
            responseTimeMs: 0,
            lastChecked: new Date().toISOString(),
            details: {
                heapUsedMb: Math.round(memUsage.heapUsed / 1024 / 1024),
                heapTotalMb: Math.round(memUsage.heapTotal / 1024 / 1024),
                heapUsedPercent: Math.round(heapUsedPercent * 100) / 100,
                externalMb: Math.round(memUsage.external / 1024 / 1024),
                rssMb: Math.round(memUsage.rss / 1024 / 1024),
            },
        };
    } catch (error) {
        return {
            name: 'Memory',
            status: HealthStatus.DOWN,
            responseTimeMs: 0,
            lastChecked: new Date().toISOString(),
            error: (error as Error).message,
        };
    }
}

/**
 * Perform comprehensive system health check
 */
export async function performHealthCheck(): Promise<SystemHealth> {
    const startTime = Date.now();

    const [dbHealth, cacheHealth] = await Promise.all([
        checkDatabaseHealth(),
        checkCacheHealth(),
    ]);

    const memoryHealth = checkMemoryHealth();

    // Determine overall status
    let overallStatus = HealthStatus.UP;
    const components = [dbHealth, cacheHealth, memoryHealth];

    if (components.some(c => c.status === HealthStatus.DOWN)) {
        overallStatus = HealthStatus.DOWN;
    } else if (components.some(c => c.status === HealthStatus.DEGRADED)) {
        overallStatus = HealthStatus.DEGRADED;
    }

    const metricsData = metrics.getMetrics();
    const client = mongoose.connection.getClient();
    const activeConnections = (client as any)?.topology?.s?.sessionPool
        ?.sessions?.length || 0;

    return {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: metricsData.uptime,
        components,
        metrics: {
            requestsPerMinute: metricsData.requestsPerMinute,
            errorRatePercent: metricsData.errorRatePercent,
            avgResponseTimeMs: metricsData.avgResponseTimeMs,
            activeConnections,
        },
    };
}

/**
 * Health check endpoint
 */
export async function healthCheckEndpoint(req: Request, res: Response) {
    const health = await performHealthCheck();

    const statusCode = health.status === HealthStatus.UP ? 200 :
        health.status === HealthStatus.DEGRADED ? 202 : 503;

    res.status(statusCode).json(health);
}

/**
 * Liveness probe (is the service running?)
 */
export function livenessProbe(req: Request, res: Response) {
    res.json({
        status: 'alive',
        timestamp: new Date().toISOString(),
        pid: process.pid,
    });
}

/**
 * Readiness probe (is the service ready to handle traffic?)
 */
export async function readinessProbe(req: Request, res: Response) {
    try {
        // Check database connectivity
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({
                status: 'not-ready',
                reason: 'Database not connected',
            });
        }

        res.json({
            status: 'ready',
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        res.status(503).json({
            status: 'not-ready',
            error: (error as Error).message,
        });
    }
}

/**
 * Metrics endpoint for Prometheus or similar monitoring
 */
export function metricsEndpoint(req: Request, res: Response) {
    try {
        const data = metrics.getMetrics();
        const memUsage = process.memoryUsage();

        // Prometheus format
        const prometheusMetrics = `
# HELP request_rate Requests per minute
# TYPE request_rate gauge
request_rate ${data.requestsPerMinute}

# HELP error_rate Error rate percentage
# TYPE error_rate gauge
error_rate ${data.errorRatePercent}

# HELP response_time Average response time in ms
# TYPE response_time gauge
response_time ${data.avgResponseTimeMs}

# HELP process_uptime Process uptime in minutes
# TYPE process_uptime gauge
process_uptime ${data.uptime}

# HELP process_memory_heap_used Heap memory used in bytes
# TYPE process_memory_heap_used gauge
process_memory_heap_used ${memUsage.heapUsed}

# HELP process_memory_heap_total Total heap memory in bytes
# TYPE process_memory_heap_total gauge
process_memory_heap_total ${memUsage.heapTotal}

# HELP process_memory_rss Resident set size in bytes
# TYPE process_memory_rss gauge
process_memory_rss ${memUsage.rss}
        `.trim();

        res.type('text/plain').send(prometheusMetrics);
    } catch (error) {
        res.status(500).json({
            error: (error as Error).message,
        });
    }
}
