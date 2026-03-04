/**
 * Alert System
 * Monitors thresholds and triggers alerts via multiple channels
 */

import { captureMessage } from '../integrations/sentry';

/**
 * Alert severity levels
 */
export enum AlertSeverity {
    INFO = 'info',
    WARNING = 'warning',
    CRITICAL = 'critical',
}

/**
 * Alert channels
 */
export enum AlertChannel {
    SLACK = 'slack',
    EMAIL = 'email',
    WEBHOOK = 'webhook',
    SENTRY = 'sentry',
    CONSOLE = 'console',
}

/**
 * Alert configuration
 */
export interface Alert {
    id: string;
    title: string;
    message: string;
    severity: AlertSeverity;
    timestamp: string;
    metadata?: Record<string, any>;
    channels: AlertChannel[];
    resolved?: boolean;
}

/**
 * Threshold configuration
 */
export interface ThresholdConfig {
    metricName: string;
    threshold: number;
    threshold_unit?: string;
    comparison: 'greaterThan' | 'lessThan' | 'equals';
    alertSeverity: AlertSeverity;
    channels: AlertChannel[];
    enabled: boolean;
}

/**
 * Alert history
 */
class AlertHistory {
    private alerts: Map<string, Alert> = new Map();
    private thresholds: Map<string, ThresholdConfig> = new Map();
    private maxAlerts = 100;

    addAlert(alert: Alert) {
        this.alerts.set(alert.id, alert);

        // Keep only recent alerts
        if (this.alerts.size > this.maxAlerts) {
            const firstKey = this.alerts.keys().next().value;
            if (firstKey) {
                this.alerts.delete(firstKey);
            }
        }
    }

    getAlert(id: string): Alert | undefined {
        return this.alerts.get(id);
    }

    getAllAlerts(): Alert[] {
        return Array.from(this.alerts.values());
    }

    getActiveAlerts(): Alert[] {
        return Array.from(this.alerts.values()).filter(a => !a.resolved);
    }

    resolveAlert(id: string) {
        const alert = this.alerts.get(id);
        if (alert) {
            alert.resolved = true;
        }
    }

    addThreshold(config: ThresholdConfig) {
        this.thresholds.set(config.metricName, config);
    }

    getThreshold(metricName: string): ThresholdConfig | undefined {
        return this.thresholds.get(metricName);
    }

    getAllThresholds(): ThresholdConfig[] {
        return Array.from(this.thresholds.values());
    }

    getEnabledThresholds(): ThresholdConfig[] {
        return this.getAllThresholds().filter(t => t.enabled);
    }
}

const alertHistory = new AlertHistory();

/**
 * Default threshold configurations
 */
const defaultThresholds: ThresholdConfig[] = [
    {
        metricName: 'errorRate',
        threshold: 5,
        threshold_unit: '%',
        comparison: 'greaterThan',
        alertSeverity: AlertSeverity.CRITICAL,
        channels: [AlertChannel.SLACK, AlertChannel.SENTRY],
        enabled: true,
    },
    {
        metricName: 'responseTime',
        threshold: 1000,
        threshold_unit: 'ms',
        comparison: 'greaterThan',
        alertSeverity: AlertSeverity.WARNING,
        channels: [AlertChannel.SLACK],
        enabled: true,
    },
    {
        metricName: 'memoryUsage',
        threshold: 90,
        threshold_unit: '%',
        comparison: 'greaterThan',
        alertSeverity: AlertSeverity.CRITICAL,
        channels: [AlertChannel.SLACK, AlertChannel.SENTRY],
        enabled: true,
    },
    {
        metricName: 'cpuUsage',
        threshold: 85,
        threshold_unit: '%',
        comparison: 'greaterThan',
        alertSeverity: AlertSeverity.WARNING,
        channels: [AlertChannel.SLACK],
        enabled: true,
    },
    {
        metricName: 'databaseConnections',
        threshold: 45,
        threshold_unit: 'count',
        comparison: 'greaterThan',
        alertSeverity: AlertSeverity.WARNING,
        channels: [AlertChannel.SLACK],
        enabled: true,
    },
    {
        metricName: 'diskSpace',
        threshold: 90,
        threshold_unit: '%',
        comparison: 'greaterThan',
        alertSeverity: AlertSeverity.CRITICAL,
        channels: [AlertChannel.SLACK, AlertChannel.EMAIL],
        enabled: true,
    },
];

// Initialize with default thresholds
defaultThresholds.forEach(t => alertHistory.addThreshold(t));

/**
 * Trigger an alert
 */
export function triggerAlert(
    title: string,
    message: string,
    severity: AlertSeverity = AlertSeverity.WARNING,
    metadata?: Record<string, any>,
    channels?: AlertChannel[]
): Alert {
    const alert: Alert = {
        id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title,
        message,
        severity,
        timestamp: new Date().toISOString(),
        metadata,
        channels: channels || getDefaultChannelsForSeverity(severity),
    };

    alertHistory.addAlert(alert);

    // Send to configured channels
    sendAlert(alert);

    return alert;
}

/**
 * Check metric against threshold
 */
export function checkMetricThreshold(
    metricName: string,
    value: number
): { triggered: boolean; alert?: Alert } {
    const threshold = alertHistory.getThreshold(metricName);

    if (!threshold || !threshold.enabled) {
        return { triggered: false };
    }

    let conditionMet = false;

    switch (threshold.comparison) {
        case 'greaterThan':
            conditionMet = value > threshold.threshold;
            break;
        case 'lessThan':
            conditionMet = value < threshold.threshold;
            break;
        case 'equals':
            conditionMet = value === threshold.threshold;
            break;
    }

    if (conditionMet) {
        const alert = triggerAlert(
            `Threshold Alert: ${metricName}`,
            `${metricName} is ${threshold.comparison} threshold: ${value}${threshold.threshold_unit} (threshold: ${threshold.threshold}${threshold.threshold_unit})`,
            threshold.alertSeverity,
            { metric: metricName, value, threshold: threshold.threshold },
            threshold.channels
        );

        return { triggered: true, alert };
    }

    return { triggered: false };
}

/**
 * Get default channels based on severity
 */
function getDefaultChannelsForSeverity(severity: AlertSeverity): AlertChannel[] {
    switch (severity) {
        case AlertSeverity.CRITICAL:
            return [AlertChannel.SLACK, AlertChannel.EMAIL, AlertChannel.SENTRY];
        case AlertSeverity.WARNING:
            return [AlertChannel.SLACK, AlertChannel.SENTRY];
        case AlertSeverity.INFO:
            return [AlertChannel.CONSOLE, AlertChannel.SENTRY];
    }
}

/**
 * Send alert to configured channels
 */
function sendAlert(alert: Alert) {
    for (const channel of alert.channels) {
        switch (channel) {
            case AlertChannel.SLACK:
                sendSlackAlert(alert);
                break;
            case AlertChannel.EMAIL:
                sendEmailAlert(alert);
                break;
            case AlertChannel.WEBHOOK:
                sendWebhookAlert(alert);
                break;
            case AlertChannel.SENTRY:
                sendSentryAlert(alert);
                break;
            case AlertChannel.CONSOLE:
                sendConsoleAlert(alert);
                break;
        }
    }
}

/**
 * Send to Slack
 */
function sendSlackAlert(alert: Alert) {
    if (!process.env.SLACK_WEBHOOK_URL) {
        return;
    }

    const color = alert.severity === AlertSeverity.CRITICAL ? 'danger' : 
                  alert.severity === AlertSeverity.WARNING ? 'warning' : 'good';

    const payload = {
        attachments: [
            {
                color,
                title: alert.title,
                text: alert.message,
                fields: [
                    { title: 'Severity', value: alert.severity, short: true },
                    { title: 'Timestamp', value: alert.timestamp, short: true },
                ],
                metadata: alert.metadata,
            },
        ],
    };

    // Make HTTP request to Slack webhook
    fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    }).catch(err => console.error('Failed to send Slack alert:', err));
}

/**
 * Send via email
 */
function sendEmailAlert(alert: Alert) {
    if (!process.env.EMAIL_SERVICE_URL) {
        return;
    }

    // Make HTTP request to email service
    fetch(process.env.EMAIL_SERVICE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            to: process.env.ALERT_EMAIL,
            subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
            message: alert.message,
            timestamp: alert.timestamp,
            metadata: alert.metadata,
        }),
    }).catch(err => console.error('Failed to send email alert:', err));
}

/**
 * Send to custom webhook
 */
function sendWebhookAlert(alert: Alert) {
    if (!process.env.ALERT_WEBHOOK_URL) {
        return;
    }

    fetch(process.env.ALERT_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert),
    }).catch(err => console.error('Failed to send webhook alert:', err));
}

/**
 * Send to Sentry
 */
function sendSentryAlert(alert: Alert) {
    captureMessage(alert.message, alert.severity as any, {
        alertId: alert.id,
        title: alert.title,
        timestamp: alert.timestamp,
        ...alert.metadata,
    });
}

/**
 * Send to console
 */
function sendConsoleAlert(alert: Alert) {
    const payload = JSON.stringify({
        type: 'alert',
        id: alert.id,
        title: alert.title,
        message: alert.message,
        severity: alert.severity,
        timestamp: alert.timestamp,
        metadata: alert.metadata,
    });

    if (alert.severity === AlertSeverity.CRITICAL) {
        console.error(payload);
        return;
    }

    if (alert.severity === AlertSeverity.WARNING) {
        console.warn(payload);
        return;
    }

    console.info(payload);
}

/**
 * Get all alerts
 */
export function getAllAlerts(): Alert[] {
    return alertHistory.getAllAlerts();
}

/**
 * Get active alerts
 */
export function getActiveAlerts(): Alert[] {
    return alertHistory.getActiveAlerts();
}

/**
 * Resolve an alert
 */
export function resolveAlert(alertId: string) {
    alertHistory.resolveAlert(alertId);
}

/**
 * Get or set threshold
 */
export function getThreshold(metricName: string): ThresholdConfig | undefined {
    return alertHistory.getThreshold(metricName);
}

export function setThreshold(config: ThresholdConfig) {
    alertHistory.addThreshold(config);
}

/**
 * Get all thresholds
 */
export function getAllThresholds(): ThresholdConfig[] {
    return alertHistory.getAllThresholds();
}

/**
 * Enable/disable threshold
 */
export function enableThreshold(metricName: string, enabled: boolean) {
    const config = alertHistory.getThreshold(metricName);
    if (config) {
        config.enabled = enabled;
    }
}

export default {
    triggerAlert,
    checkMetricThreshold,
    getAllAlerts,
    getActiveAlerts,
    resolveAlert,
    getThreshold,
    setThreshold,
    getAllThresholds,
    enableThreshold,
};
