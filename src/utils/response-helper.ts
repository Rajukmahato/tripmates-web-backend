/**
 * API Response Utilities
 * Standardizes API responses across the application
 */

import { Response } from 'express';

export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    statusCode: number;
    timestamp: string;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

/**
 * Send a successful response
 */
export const sendSuccess = <T = any>(
    res: Response,
    message: string,
    data?: T,
    statusCode: number = 200,
    pagination?: any
): Response => {
    return res.status(statusCode).json({
        success: true,
        message,
        ...(data && { data }),
        statusCode,
        timestamp: new Date().toISOString(),
        ...(pagination && { pagination }),
    } as ApiResponse<T>);
};

/**
 * Send an error response
 */
export const sendError = (
    res: Response,
    message: string,
    statusCode: number = 400,
    errors?: Record<string, string[]>
): Response => {
    return res.status(statusCode).json({
        success: false,
        message,
        statusCode,
        timestamp: new Date().toISOString(),
        ...(errors && { errors }),
    } as Partial<ApiResponse>);
};

/**
 * Format pagination data
 */
export const formatPagination = (
    currentPage: number,
    totalPages: number,
    limit: number,
    total: number
) => {
    return {
        page: currentPage,
        limit,
        total,
        pages: totalPages,
    };
};
