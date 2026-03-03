/**
 * Global Error Handler Middleware
 * Centralized error handling for all routes
 */

import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../errors/http-error';
import { StandardApiResponse, errorResponse } from '../utils/api-response';

// Custom error interface
export interface ApiErrorResponse extends StandardApiResponse {
    statusCode: number;
    path: string;
}

/**
 * Global error handler middleware
 * Should be the last middleware in the chain
 */
export const globalErrorHandler = (
    err: Error | HttpError | any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const isProduction = process.env.NODE_ENV === 'production';
    const requestId = (req as any).requestId;

    // Determine status code
    let statusCode = 500;
    let message = 'Internal Server Error';
    let errorDetails: any = null;

    // Handle HttpError
    if (err instanceof HttpError) {
        statusCode = err.statusCode;
        message = err.message;
    }
    // Handle validation errors
    else if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation error';
        errorDetails = err.errors;
    }
    // Handle MongoDB errors
    else if (err.name === 'MongoError' || err.name === 'MongoServerError') {
        statusCode = 500;
        message = 'Database error';
        if (!isProduction) {
            errorDetails = err.message;
        }
    }
    // Handle JWT errors
    else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    }
    else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token has expired';
    }
    // Handle rate limit errors (shouldn't reach here due to rate limit middleware)
    else if (err.status === 429) {
        statusCode = 429;
        message = err.message || 'Too many requests';
    }
    // Default error handling
    else {
        statusCode = err.statusCode || 500;
        message = err.message || 'An unexpected error occurred';
    }

    // Log error details
    const logEntry = {
        timestamp: new Date().toISOString(),
        requestId,
        method: req.method,
        path: req.path,
        statusCode,
        message,
        userAgent: req.get('user-agent'),
        ip: req.ip,
        ...(process.env.NODE_ENV === 'development' && {
            stack: err.stack,
            details: errorDetails,
        }),
    };

    // Log based on severity
    if (statusCode >= 500) {
        console.error('🔴 SERVER ERROR:', logEntry);
    } else if (statusCode >= 400) {
        console.warn('🟡 CLIENT ERROR:', logEntry);
    }

    // Hide internal error details in production
    if (isProduction && statusCode === 500) {
        message = 'An internal server error occurred. Please try again later.';
    }

    // Build error response
    const apiErrorResponse: ApiErrorResponse = {
        ...errorResponse(statusCode, message, undefined, requestId),
        path: req.path,
    };

    // Add error details in development
    if (process.env.NODE_ENV === 'development' && errorDetails) {
        apiErrorResponse.errors = errorDetails;
    }

    res.status(statusCode).json(apiErrorResponse);
};

/**
 * 404 Not Found Handler
 * Should be after all other routes
 */
export const notFoundHandler = (req: Request, res: Response) => {
    const requestId = (req as any).requestId;
    
    const response: ApiErrorResponse = {
        ...errorResponse(404, `Route ${req.method} ${req.path} not found`, undefined, requestId),
        path: req.path,
    };

    res.status(404).json(response);
};

/**
 * Async route wrapper to catch errors
 * Wraps async route handlers to catch errors and pass to error handler
 */
export const asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
