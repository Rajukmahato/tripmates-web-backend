/**
 * Input Sanitization Middleware
 * Protects against XSS, NoSQL injection, and other input-based attacks
 */

import xss from 'xss';
import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../errors/http-error';

/**
 * Custom Mongo sanitization - prevents NoSQL injection
 * Removes $ and . from user inputs to prevent injection
 * Compatible with Express 5 (doesn't modify read-only properties)
 */
export const mongoSanitization = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    try {
        const sanitizeValue = (val: any): any => {
            if (val === null || val === undefined) {
                return val;
            }

            if (Array.isArray(val)) {
                return val.map(sanitizeValue);
            }

            if (typeof val === 'object' && val.constructor === Object) {
                const sanitized: any = {};
                for (const [key, value] of Object.entries(val)) {
                    // Remove keys with $ or . to prevent NoSQL injection
                    const sanitizedKey = key.replace(/[$\.]/g, '_');
                    
                    if (sanitizedKey !== key) {
                        console.warn(`⚠️ Potential NoSQL injection detected in field: ${key}`);
                    }
                    
                    sanitized[sanitizedKey] = sanitizeValue(value);
                }
                return sanitized;
            }

            return val;
        };

        // Sanitize body (mutable)
        if (req.body && typeof req.body === 'object') {
            req.body = sanitizeValue(req.body);
        }

        // Sanitize params (mutable)
        if (req.params && typeof req.params === 'object') {
            req.params = sanitizeValue(req.params);
        }

        // For query (read-only in Express 5), validate instead of modifying
        if (req.query && typeof req.query === 'object') {
            const hasInjection = (obj: any): boolean => {
                if (obj === null || obj === undefined) return false;
                
                if (Array.isArray(obj)) {
                    return obj.some(hasInjection);
                }
                
                if (typeof obj === 'object' && obj.constructor === Object) {
                    for (const [key, value] of Object.entries(obj)) {
                        if (key.includes('$') || key.includes('.')) {
                            console.warn(`⚠️ Potential NoSQL injection in query param: ${key}`);
                            return true;
                        }
                        if (hasInjection(value)) {
                            return true;
                        }
                    }
                }
                
                return false;
            };

            if (hasInjection(req.query)) {
                throw new HttpError(
                    400,
                    'Invalid query parameters detected. Please remove special characters like $ and .'
                );
            }
        }

        next();
    } catch (error) {
        next(error);
    }
};

/**
 * XSS Protection - cleans user inputs
 * Removes potentially dangerous HTML/JavaScript
 */
export class XssProtection {
    /**
     * Sanitize a single string value
     */
    static sanitizeString(str: string): string {
        if (!str || typeof str !== 'string') {
            return str;
        }
        return xss(str, {
            whiteList: {}, // Don't allow any HTML tags
            stripIgnoreTag: true,
        });
    }

    /**
     * Sanitize object properties recursively
     */
    static sanitizeObject(obj: any): any {
        if (!obj) return obj;

        if (Array.isArray(obj)) {
            return obj.map(item => this.sanitizeObject(item));
        }

        if (obj !== null && typeof obj === 'object') {
            const sanitized: any = {};
            for (const [key, value] of Object.entries(obj)) {
                if (typeof value === 'string') {
                    sanitized[key] = this.sanitizeString(value);
                } else if (Array.isArray(value) || (value !== null && typeof value === 'object')) {
                    sanitized[key] = this.sanitizeObject(value);
                } else {
                    sanitized[key] = value;
                }
            }
            return sanitized;
        }

        if (typeof obj === 'string') {
            return this.sanitizeString(obj);
        }

        return obj;
    }
}

/**
 * XSS Protection middleware
 * Sanitizes request body, query, and params
 * Compatible with Express 5 (doesn't modify read-only query property)
 */
export const xssProtectionMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    try {
        // Sanitize request body
        if (req.body && typeof req.body === 'object') {
            req.body = XssProtection.sanitizeObject(req.body);
        }

        // Validate query parameters for XSS (read-only in Express 5, can't modify)
        if (req.query && typeof req.query === 'object') {
            const hasXss = (value: any): boolean => {
                if (typeof value === 'string') {
                    const dangerous = /<script|javascript:|onerror=|onclick=/i.test(value);
                    if (dangerous) {
                        console.warn('⚠️ Potential XSS detected in query parameter');
                    }
                    return dangerous;
                }
                if (Array.isArray(value)) {
                    return value.some(hasXss);
                }
                if (value !== null && typeof value === 'object') {
                    return Object.values(value).some(hasXss);
                }
                return false;
            };

            if (hasXss(req.query)) {
                throw new HttpError(
                    400,
                    'Invalid query parameters detected. Please remove potentially dangerous content.'
                );
            }
        }

        // Sanitize URL parameters
        if (req.params && typeof req.params === 'object') {
            req.params = XssProtection.sanitizeObject(req.params);
        }

        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Input validation helper
 * Validates common input patterns
 */
export class InputValidator {
    /**
     * Validate email format
     */
    static validateEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate phone number (10 digits)
     */
    static validatePhoneNumber(phone: string): boolean {
        const phoneRegex = /^[0-9]{10}$/;
        return phoneRegex.test(phone);
    }

    /**
     * Validate URL format
     */
    static validateUrl(url: string): boolean {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Check for NoSQL injection patterns
     */
    static hasNoSqlInjectionPatterns(str: any): boolean {
        if (typeof str !== 'string') return false;

        const injectionPatterns = [
            /\$where/i,
            /\$ne/i,
            /\$gt/i,
            /\$lt/i,
            /\$or/i,
            /\$and/i,
            /\$regex/i,
            /\$injection/i,
        ];

        return injectionPatterns.some(pattern => pattern.test(str));
    }

    /**
     * Validate file extension
     */
    static validateFileExtension(
        filename: string,
        allowedExtensions: string[]
    ): boolean {
        const ext = filename.split('.').pop()?.toLowerCase();
        return ext ? allowedExtensions.includes(ext) : false;
    }

    /**
     * Validate file size
     */
    static validateFileSize(
        fileSizeInBytes: number,
        maxSizeInMB: number
    ): boolean {
        const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
        return fileSizeInBytes <= maxSizeInBytes;
    }

    /**
     * Validate content length
     */
    static validateContentLength(content: string, maxLength: number): boolean {
        return content.length <= maxLength;
    }

    /**
     * Validate MongoDB ObjectID format
     */
    static validateObjectId(id: string): boolean {
        const objectIdRegex = /^[0-9a-fA-F]{24}$/;
        return objectIdRegex.test(id);
    }

    /**
     * Check for potential path traversal
     */
    static hasPathTraversal(str: string): boolean {
        return /\.\.\/|\.\.\\/.test(str);
    }
}

/**
 * Generic input sanitization and validation middleware
 * Used to validate common patterns across all endpoints
 */
export const validateAndSanitizeInput = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    try {
        // Check for NoSQL injection patterns in all inputs
        const checkNoSqlInjection = (obj: any): void => {
            if (typeof obj === 'string') {
                if (InputValidator.hasNoSqlInjectionPatterns(obj)) {
                    throw new HttpError(
                        400,
                        'Invalid input detected. Please remove special characters.'
                    );
                }
            } else if (obj !== null && typeof obj === 'object') {
                if (Array.isArray(obj)) {
                    obj.forEach(checkNoSqlInjection);
                } else {
                    Object.values(obj).forEach(checkNoSqlInjection);
                }
            }
        };

        // Check body
        if (req.body && typeof req.body === 'object') {
            checkNoSqlInjection(req.body);
        }

        // Check query
        if (req.query && typeof req.query === 'object') {
            checkNoSqlInjection(req.query);
        }

        // Check params
        if (req.params && typeof req.params === 'object') {
            checkNoSqlInjection(req.params);
        }

        next();
    } catch (error) {
        next(error);
    }
};
