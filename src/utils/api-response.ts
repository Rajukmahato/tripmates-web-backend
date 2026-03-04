/**
 * Standardized API Response Format
 * Ensures consistent response structure across all endpoints
 */

import { Request } from 'express';

export interface StandardApiResponse<T = any> {
    success: boolean;
    statusCode: number;
    message: string;
    data?: T;
    errors?: Record<string, string | string[]>;
    requestId?: string;
    apiVersion: string;
    timestamp: string;
    pagination?: PaginationInfo;
}

export interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasMore: boolean;
}

/**
 * Creates a standardized success response
 */
export const successResponse = <T>(
    statusCode: number,
    message: string,
    data?: T,
    pagination?: PaginationInfo,
    requestId?: string
): StandardApiResponse<T> => {
    return {
        success: true,
        statusCode,
        message,
        ...(data && { data }),
        apiVersion: '1.0.0',
        timestamp: new Date().toISOString(),
        requestId,
        ...(pagination && { pagination }),
    };
};

/**
 * Creates a standardized error response
 */
export const errorResponse = (
    statusCode: number,
    message: string,
    errors?: Record<string, string | string[]>,
    requestId?: string
): StandardApiResponse => {
    return {
        success: false,
        statusCode,
        message,
        ...(errors && { errors }),
        apiVersion: '1.0.0',
        timestamp: new Date().toISOString(),
        requestId,
    };
};

/**
 * Helper to calculate pagination info
 */
export const calculatePaginationInfo = (
    page: number,
    limit: number,
    total: number
): PaginationInfo => {
    const pages = Math.ceil(total / limit);
    return {
        page,
        limit,
        total,
        pages,
        hasMore: page < pages,
    };
};

/**
 * Helper to attach request context to responses
 */
export const attachRequestContext = (
    response: StandardApiResponse,
    req: Request
): StandardApiResponse => {
    response.requestId = (req as any).requestId;
    return response;
};

/**
 * Format pagination response
 */
export const paginatedResponse = <T>(
    statusCode: number,
    message: string,
    data: T[],
    page: number,
    limit: number,
    total: number,
    requestId?: string
): StandardApiResponse<T[]> => {
    const pagination = calculatePaginationInfo(page, limit, total);
    return {
        success: true,
        statusCode,
        message,
        data,
        pagination,
        apiVersion: '1.0.0',
        timestamp: new Date().toISOString(),
        requestId,
    };
};

/**
 * Validation error response
 */
export const validationErrorResponse = (
    validationErrors: Record<string, string | string[]>,
    requestId?: string
): StandardApiResponse => {
    return {
        success: false,
        statusCode: 400,
        message: 'Validation failed',
        errors: validationErrors,
        apiVersion: '1.0.0',
        timestamp: new Date().toISOString(),
        requestId,
    };
};
