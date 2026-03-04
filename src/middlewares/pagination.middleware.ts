/**
 * Pagination Middleware
 * Standardizes pagination across all endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../errors/http-error';

export interface PaginationQuery {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
        hasMore: boolean;
    };
}

// Pagination constants
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MIN_LIMIT = 1;
const MAX_LIMIT = 100;
const MIN_PAGE = 1;

/**
 * Pagination validation and parse middleware
 * Validates and parses pagination query parameters
 */
export const paginationMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        // Parse page
        let page = parseInt(req.query.page as string, 10) || DEFAULT_PAGE;
        if (page < MIN_PAGE) {
            page = DEFAULT_PAGE;
        }

        // Parse limit
        let limit = parseInt(req.query.limit as string, 10) || DEFAULT_LIMIT;
        if (limit < MIN_LIMIT) {
            limit = DEFAULT_LIMIT;
        }
        if (limit > MAX_LIMIT) {
            limit = MAX_LIMIT;
        }

        // Parse sort params
        const sortBy = (req.query.sortBy as string) || 'createdAt';
        const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';

        // Validate sort order
        if (!['asc', 'desc'].includes(sortOrder)) {
            throw new HttpError(400, 'Sort order must be "asc" or "desc"');
        }

        // Attach to request
        (req as any).pagination = {
            page,
            limit,
            sortBy: sanitizeSortBy(sortBy),
            sortOrder,
            skip: (page - 1) * limit,
        };

        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Sanitize sortBy parameter to prevent injection
 */
function sanitizeSortBy(sortBy: string): string {
    // Only allow alphanumeric, underscore, and dot for nested fields
    const sanitized = sortBy.replace(/[^a-zA-Z0-9_.]/g, '');
    return sanitized || 'createdAt';
}

/**
 * Helper to calculate pagination info
 */
export const calculatePagination = (
    page: number,
    limit: number,
    total: number
) => {
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
 * Helper to build paginated response
 */
export const buildPaginatedResponse = <T>(
    data: T[],
    page: number,
    limit: number,
    total: number
): PaginatedResult<T> => {
    return {
        data,
        pagination: calculatePagination(page, limit, total),
    };
};

/**
 * Get MongoDB skip and sort options
 */
export const getMongoosePaginationOptions = (pagination: any) => {
    return {
        skip: pagination.skip,
        limit: pagination.limit,
        sort: {
            [pagination.sortBy]: pagination.sortOrder === 'asc' ? 1 : -1,
        },
    };
};

/**
 * Validate pagination params
 */
export const validatePaginationParams = (page: number, limit: number): boolean => {
    return page >= MIN_PAGE && limit >= MIN_LIMIT && limit <= MAX_LIMIT;
};

/**
 * Get pagination info from request
 */
export const getPaginationFromRequest = (req: Request) => {
    return (req as any).pagination || {
        page: DEFAULT_PAGE,
        limit: DEFAULT_LIMIT,
        skip: 0,
        sortBy: 'createdAt',
        sortOrder: 'desc',
    };
};
