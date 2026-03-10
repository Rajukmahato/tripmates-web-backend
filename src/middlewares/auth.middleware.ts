import { Request, Response, NextFunction } from 'express';
import { JWT_SECRET } from '../configs';
import jwt from 'jsonwebtoken';
import { IUser } from '../modules/user.model';
import { UserRepository } from '../repositories/user.repository';
import { HttpError } from '../errors/http-error';

let userRepository = new UserRepository();

/**
 * Middleware to verify JWT token and attach user to request
 */
export const authorizedMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            throw new HttpError(401, 'Authorization header is missing');
        }

        if (!authHeader.startsWith('Bearer ')) {
            throw new HttpError(401, 'Invalid authorization header format. Expected "Bearer <token>"');
        }

        const token = authHeader.split(' ')[1];
        
        if (!token) {
            throw new HttpError(401, 'JWT token is missing');
        }

        // Verify token
        let decodedToken: any;
        try {
            decodedToken = jwt.verify(token, JWT_SECRET);
        } catch (err: any) {
            if (err.name === 'TokenExpiredError') {
                throw new HttpError(401, 'Token has expired');
            }
            if (err.name === 'JsonWebTokenError') {
                throw new HttpError(401, 'Invalid token');
            }
            throw new HttpError(401, 'Token verification failed');
        }

        if (!decodedToken || !decodedToken.id) {
            throw new HttpError(401, 'Invalid token payload');
        }

        // Get user from database
        const user = await userRepository.getUserById(decodedToken.id);
        
        if (!user) {
            throw new HttpError(401, 'User not found');
        }

        // Attach user to request
        (req as any).user = user;

        next();
        
    } catch (err: any) {
        const statusCode = err.statusCode || 401;
        const message = err.message || 'Authentication failed';

        res.status(statusCode).json({
            success: false,
            message,
            statusCode,
            timestamp: new Date().toISOString(),
        });
    }
};

/**
 * Optional auth middleware - doesn't fail if token is invalid
 * Useful for endpoints that can work with or without auth
 */
export const optionalAuthMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // No token provided - continue without user
            next();
            return;
        }

        const token = authHeader.split(' ')[1];
        
        if (!token) {
            next();
            return;
        }

        // Try to verify token
        try {
            const decodedToken = jwt.verify(token, JWT_SECRET) as any;
            
            if (decodedToken && decodedToken.id) {
                const user = await userRepository.getUserById(decodedToken.id);
                if (user) {
                    (req as any).user = user;
                }
            }
        } catch (err) {
            // Token is invalid but continue anyway
            console.debug('Optional auth token is invalid, continuing without user context');
        }

        next();
        
    } catch (err) {
        // Continue without user
        next();
    }
};