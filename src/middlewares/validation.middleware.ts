/**
 * Request Validation Middleware
 * Validates request bodies against Zod schemas
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { HttpError } from '../errors/http-error';

/**
 * Validates request body against a Zod schema
 * @param schema - Zod schema to validate against
 * @param source - Which part of request to validate (body, params, query)
 */
export const validateRequest = (schema: ZodSchema, source: 'body' | 'params' | 'query' = 'body') => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            const dataToValidate = source === 'body' ? req.body : source === 'params' ? req.params : req.query;

            const result = schema.safeParse(dataToValidate);

            if (!result.success) {
                // Format validation errors
                const errors: Record<string, string[]> = {};
                
                result.error.issues.forEach((issue): void => {
                    const field = issue.path.join('.');
                    if (!errors[field]) {
                        errors[field] = [];
                    }
                    errors[field].push(issue.message);
                });

                throw new HttpError(400, `Validation failed: ${JSON.stringify(errors)}`);
            }

            // Attach validated data to request
            if (source === 'body') {
                req.body = result.data as Record<string, unknown>;
            } else if (source === 'params') {
                req.params = result.data as Record<string, string>;
            } else {
                req.query = result.data as Record<string, string | string[] | undefined>;
            }

            next();

        } catch (error: unknown) {
            const httpError = error instanceof HttpError ? error : new HttpError(400, 'Validation error');
            res.status(httpError.statusCode || 400).json({
                success: false,
                message: httpError.message,
                statusCode: httpError.statusCode || 400,
            });
        }
    };
};

/**
 * Generic async handler wrapper
 * Ensures errors from async route handlers are caught
 */
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
