/**
 * Sentry Error Tracking Integration
 * Centralized error reporting and performance monitoring
 */

import * as Sentry from '@sentry/node';
import { Application, Request, Response, NextFunction } from 'express';
import type { Breadcrumb, Event, EventHint, Scope } from '@sentry/types';

/**
 * Initialize Sentry integration
 */
export function initializeSentry(app: Application) {
    // Check if Sentry is enabled
    if (!process.env.SENTRY_DSN) {
        console.warn('⚠️ Sentry DSN not configured. Error tracking disabled.');
        console.warn('   Set SENTRY_DSN environment variable to enable');
        return;
    }

    try {
        Sentry.init({
            dsn: process.env.SENTRY_DSN,
            environment: process.env.NODE_ENV || 'development',
            tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
            maxBreadcrumbs: 50,
            attachStacktrace: true,
            
            // Server-side integration
            integrations: [
                new Sentry.Integrations.Http({ tracing: true }),
                new Sentry.Integrations.OnUncaughtException(),
                new Sentry.Integrations.OnUnhandledRejection(),
            ],

            // Filtering
            beforeSend(event: Event, hint?: EventHint) {
                // Filter out health checks
                if (event.request?.url?.includes('/health')) {
                    return null;
                }

                // Filter out metrics
                if (event.request?.url?.includes('/metrics')) {
                    return null;
                }

                // Filter 4xx client errors (optional - adjust based on needs)
                if (event.exception) {
                    const statusCode = (hint?.originalException as any)?.statusCode;
                    if (statusCode && statusCode < 500 && statusCode >= 400) {
                        // Only send validation errors
                        if (statusCode === 422) {
                            return event;
                        }
                        return null;
                    }
                }

                return event;
            },

            // Breadcrumb filtering
            beforeBreadcrumb(breadcrumb: Breadcrumb, hint?: EventHint) {
                // Filter out noisy breadcrumbs
                if (breadcrumb.category === 'http') {
                    // Only log errors and unusual status codes
                    const status = (breadcrumb.data?.status_code as number) || 200;
                    if (status < 400 && breadcrumb.level === 'info') {
                        return null;
                    }
                }

                return breadcrumb;
            },
        });

        // Attach Sentry middleware to Express app
        app.use(Sentry.Handlers.requestHandler());
        app.use(Sentry.Handlers.tracingHandler());

        console.log('✅ Sentry error tracking initialized');
        console.log(`   Environment: ${process.env.NODE_ENV}`);
        console.log(`   Sample Rate: ${process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'}`);

        return true;
    } catch (error) {
        console.error('❌ Failed to initialize Sentry:', error);
        return false;
    }
}

/**
 * Attach Sentry error handler to Express
 * Should be called after all other middleware and routes
 */
export function attachSentryErrorHandler(app: Application) {
    if (!process.env.SENTRY_DSN) {
        return;
    }

    // Error handler must be last middleware
    app.use(Sentry.Handlers.errorHandler());
}

/**
 * Capture exception with additional context
 */
export function captureException(
    error: Error | string,
    context?: Record<string, any>,
    level: 'fatal' | 'error' | 'warning' | 'info' = 'error'
) {
    if (!process.env.SENTRY_DSN) {
        console.error('Error:', error, context);
        return;
    }

    const exception = typeof error === 'string' ? new Error(error) : error;

    Sentry.captureException(exception, (scope: Scope) => {
        if (context) {
            scope.setContext('additional', context);
        }
        scope.setLevel(level);
        return scope;
    });
}

/**
 * Capture message
 */
export function captureMessage(
    message: string,
    level: 'fatal' | 'error' | 'warning' | 'info' = 'info',
    context?: Record<string, any>
) {
    if (!process.env.SENTRY_DSN) {
        console.log(level.toUpperCase(), message, context);
        return;
    }

    Sentry.captureMessage(message, (scope: Scope) => {
        if (context) {
            scope.setContext('additional', context);
        }
        scope.setLevel(level);
        return scope;
    });
}

/**
 * Create a Sentry transaction for custom operations
 */
export function startTransaction(
    name: string,
    op: string
) {
    if (!process.env.SENTRY_DSN) {
        return null;
    }

    return Sentry.startTransaction({
        name,
        op,
    });
}

/**
 * Add breadcrumb for event tracking
 */
export function addBreadcrumb(
    message: string,
    category: string = 'custom',
    level: 'fatal' | 'error' | 'warning' | 'info' = 'info',
    data?: Record<string, any>
) {
    if (!process.env.SENTRY_DSN) {
        return;
    }

    Sentry.addBreadcrumb({
        message,
        category,
        level,
        data,
        timestamp: Date.now() / 1000,
    });
}

/**
 * Set user context for error tracking
 */
export function setUser(userId: string, metadata?: Record<string, any>) {
    if (!process.env.SENTRY_DSN) {
        return;
    }

    Sentry.setUser({
        id: userId,
        username: metadata?.username,
        email: metadata?.email,
        ...metadata,
    });
}

/**
 * Clear user context
 */
export function clearUser() {
    if (!process.env.SENTRY_DSN) {
        return;
    }

    Sentry.setUser(null);
}

/**
 * Middleware to automatically set user context from request
 */
export function sentryUserMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
) {
    if (!process.env.SENTRY_DSN) {
        return next();
    }

    try {
        // Extract user from JWT token or session
        const user = (req as any).user;
        if (user && user.id) {
            setUser(user.id, {
                email: user.email,
                username: user.name || user.fullName,
                role: user.role,
            });
        }
    } catch (error) {
        console.error('Error setting Sentry user context:', error);
    }

    next();
}

export default Sentry;
