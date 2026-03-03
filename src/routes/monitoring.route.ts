/**
 * Monitoring Dashboard API
 * Provides aggregated metrics and insights for system oversight
 */

import { Request, Response } from 'express';
import { metrics } from '../utils/health-monitoring';
import { getErrorStatistics } from '../utils/error-reporter';
import { getPerformanceMetrics } from '../utils/performance-monitor';
import { getActiveAlerts, getAllAlerts } from '../utils/alert-system';
import mongoose from 'mongoose';

/**
 * Dashboard overview endpoint
 */
export async function getDashboardOverview(req: Request, res: Response) {
    try {
        const requestMetrics = metrics.getMetrics();
        const perfMetrics = getPerformanceMetrics();
        const errorStats = getErrorStatistics();
        const alerts = {
            active: getActiveAlerts(),
            total: getAllAlerts(),
        };

        const client = mongoose.connection.getClient();
        const uptime = (Date.now() - (client as any).topology?.lastServer?.lastAuth || Date.now()) / 1000;

        const overview = {
            timestamp: new Date().toISOString(),
            uptime: Math.floor(uptime / 60), // minutes
            
            // Request metrics
            requests: {
                totalRequests: requestMetrics?.totalRequests || 0,
                totalErrors: requestMetrics?.totalErrors || 0,
                errorRate: requestMetrics?.errorRatePercent || 0,
                avgResponseTime: requestMetrics?.avgResponseTimeMs || 0,
                requestsPerMinute: requestMetrics?.requestsPerMinute || 0,
            },

            // Performance metrics
            performance: perfMetrics,

            // Error statistics
            errors: errorStats,

            // Alert status
            alerts: {
                activeCount: alerts.active.length,
                totalCount: alerts.total.length,
                criticalCount: alerts.active.filter(a => a.severity === 'critical').length,
                recentAlerts: alerts.active.slice(-5),
            },

            // System health
            health: {
                status: requestMetrics?.errorRatePercent! > 5 ? 'DEGRADED' : 'UP',
                errorRate: requestMetrics?.errorRatePercent || 0,
                responseTime: requestMetrics?.avgResponseTimeMs || 0,
            },
        };

        res.json(overview);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to get dashboard overview',
            message: (error as Error).message,
        });
    }
}

/**
 * Performance analytics endpoint
 */
export async function getPerformanceAnalytics(req: Request, res: Response) {
    try {
        const timeWindow = req.query.window || '1h';
        const perfMetrics = getPerformanceMetrics();

        const analytics = {
            timestamp: new Date().toISOString(),
            timeWindow,
            metrics: perfMetrics,

            // Performance trends
            trends: {
                database: {
                    avgTime: perfMetrics?.database?.avgDuration || 0,
                    p95Time: perfMetrics?.database?.p95Duration || 0,
                    p99Time: perfMetrics?.database?.p99Duration || 0,
                    slowQueries: perfMetrics?.database?.slowCount || 0,
                    slowPercentage: perfMetrics?.database?.slowPercentage || 0,
                },
                cache: {
                    avgTime: perfMetrics?.cache?.avgDuration || 0,
                    slowOperations: perfMetrics?.cache?.slowCount || 0,
                    hitRate: 0, // Would need to track separately
                },
                api: {
                    avgResponseTime: perfMetrics?.api?.avgDuration || 0,
                    p95ResponseTime: perfMetrics?.api?.p95Duration || 0,
                    p99ResponseTime: perfMetrics?.api?.p99Duration || 0,
                    slowEndpoints: perfMetrics?.api?.slowCount || 0,
                },
            },

            // Recommendations
            recommendations: generateRecommendations(perfMetrics),
        };

        res.json(analytics);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to get performance analytics',
            message: (error as Error).message,
        });
    }
}

/**
 * Error analytics endpoint
 */
export async function getErrorAnalytics(req: Request, res: Response) {
    try {
        const errorStats = getErrorStatistics();

        const analytics = {
            timestamp: new Date().toISOString(),
            errorStatistics: errorStats,
            recentErrors: [], // Would need to track separately
            topErrors: getTopErrors(),
            errorTrends: {}, // Would need time-series data
        };

        res.json(analytics);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to get error analytics',
            message: (error as Error).message,
        });
    }
}

/**
 * Alerts endpoint
 */
export async function getAlerts(req: Request, res: Response) {
    try {
        const filter = req.query.filter || 'active';

        const alertsData = filter === 'all' ? getAllAlerts() : getActiveAlerts();

        res.json({
            timestamp: new Date().toISOString(),
            filter,
            count: alertsData.length,
            alerts: alertsData,
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to get alerts',
            message: (error as Error).message,
        });
    }
}

/**
 * Resolve alert endpoint
 */
export async function resolveAlertEndpoint(req: Request, res: Response) {
    try {
        const { alertId } = req.params;

        if (!alertId) {
            return res.status(400).json({ error: 'alertId is required' });
        }

        const { resolveAlert } = require('../utils/alert-system');
        resolveAlert(alertId);

        res.json({
            message: `Alert ${alertId} resolved`,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to resolve alert',
            message: (error as Error).message,
        });
    }
}

/**
 * System metrics endpoint
 */
export async function getSystemMetrics(req: Request, res: Response) {
    try {
        const memUsage = process.memoryUsage();
        const uptime = process.uptime();

        const metrics_data = {
            timestamp: new Date().toISOString(),
            uptime: Math.floor(uptime / 60), // minutes
            
            memory: {
                heapUsedMb: Math.round(memUsage.heapUsed / 1024 / 1024),
                heapTotalMb: Math.round(memUsage.heapTotal / 1024 / 1024),
                heapUsedPercent: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
                externalMb: Math.round(memUsage.external / 1024 / 1024),
                rssMb: Math.round(memUsage.rss / 1024 / 1024),
            },

            cpu: {
                cpuUsagePercent: Math.round(process.cpuUsage().system / 10000),
            },

            process: {
                pid: process.pid,
                version: process.version,
                platform: process.platform,
                env: process.env.NODE_ENV,
            },
        };

        res.json(metrics_data);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to get system metrics',
            message: (error as Error).message,
        });
    }
}

/**
 * Generate recommendations based on performance
 */
function generateRecommendations(perfMetrics: any): string[] {
    const recommendations: string[] = [];

    if (perfMetrics?.database?.p99Duration && perfMetrics.database.p99Duration > 500) {
        recommendations.push('Database queries are slow. Review indexes and query optimization.');
    }

    if (perfMetrics?.api?.slowPercentage && perfMetrics.api.slowPercentage > 10) {
        recommendations.push('More than 10% of API requests are slow. Consider caching or query optimization.');
    }

    if (perfMetrics?.batch?.slowCount && perfMetrics.batch.slowCount > 0) {
        recommendations.push('Batch operations are running slowly. Consider processing in smaller batches.');
    }

    if (!recommendations.length) {
        recommendations.push('System performance is healthy. No issues detected.');
    }

    return recommendations;
}

/**
 * Get top errors by frequency
 */
function getTopErrors(): Array<{ error: string; count: number }> {
    const errorStats = getErrorStatistics();
    
    if (!errorStats.errorsByType) {
        return [];
    }

    return Object.entries(errorStats.errorsByType)
        .map(([error, count]) => ({ error, count: count as number }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
}

/**
 * Export dashboard routes setup function
 */
export function setupDashboardRoutes(app: any) {
    app.get('/api/monitoring/dashboard', getDashboardOverview);
    app.get('/api/monitoring/performance', getPerformanceAnalytics);
    app.get('/api/monitoring/errors', getErrorAnalytics);
    app.get('/api/monitoring/alerts', getAlerts);
    app.post('/api/monitoring/alerts/:alertId/resolve', resolveAlertEndpoint);
    app.get('/api/monitoring/system', getSystemMetrics);

    console.log('✅ Monitoring dashboard endpoints registered');
}

export default {
    getDashboardOverview,
    getPerformanceAnalytics,
    getErrorAnalytics,
    getAlerts,
    resolveAlertEndpoint,
    getSystemMetrics,
    setupDashboardRoutes,
};
