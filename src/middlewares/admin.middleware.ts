import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../errors/http-error';

export const adminMiddleware =
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                throw new HttpError(401, 'Unauthorized - No user found');
            }
            
            if (req.user.role !== 'admin') {
                throw new HttpError(403, 'Forbidden - Admin access required');
            }
            
            next();
        } catch (err: Error | any) {
            return res.status(err.statusCode || 500).json(
                { success: false, message: err.message }
            )
        }
    }
