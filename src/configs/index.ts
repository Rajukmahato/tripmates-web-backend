import dotenv from 'dotenv';
import { validateEnvironment } from '../utils/env-validator';

dotenv.config();

// Validate environment first
validateEnvironment();

// Safer port parsing with validation
const parsePort = (portStr?: string): number => {
    const port = portStr ? parseInt(portStr, 10) : 5050;
    if (isNaN(port) || port < 1 || port > 65535) {
        console.warn(`⚠️ Invalid PORT: ${portStr}, using default 5050`);
        return 5050;
    }
    return port;
};

// Safer int parsing for email port
const parseEmailPort = (portStr?: string): number => {
    const port = portStr ? parseInt(portStr, 10) : 587;
    if (isNaN(port) || port < 1 || port > 65535) {
        console.warn(`⚠️ Invalid EMAIL_PORT: ${portStr}, using default 587`);
        return 587;
    }
    return port;
};

export const PORT: number = parsePort(process.env.PORT);
export const MONGODB_URI: string = process.env.MONGODB_URI || 'mongodb://localhost:27017/default_db';
export const JWT_SECRET: string = getJWTSecret();
export const EMAIL_HOST: string = process.env.EMAIL_HOST || 'smtp.gmail.com';
export const EMAIL_PORT: number = parseEmailPort(process.env.EMAIL_PORT);
export const EMAIL_USER: string = process.env.EMAIL_USER || '';
export const EMAIL_PASSWORD: string = process.env.EMAIL_PASSWORD || '';
export const EMAIL_FROM: string = process.env.EMAIL_FROM || 'noreply@tripmates.com';
export const FRONTEND_URL: string = process.env.FRONTEND_URL || 'http://localhost:3000';
export const GOOGLE_MAPS_API_KEY: string = process.env.GOOGLE_MAPS_API_KEY || '';

// ===== CORS Configuration =====
export const CORS_ORIGINS = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    ...(process.env.ADDITIONAL_CORS_ORIGINS?.split(',') || []),
];

export const CORS_OPTIONS = {
    origin: CORS_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400, // 24 hours
};

/**
 * Get JWT Secret with validation
 * Prevents accidentally using weak secrets in production
 */
function getJWTSecret(): string {
    const secret = process.env.JWT_SECRET;
    
    if (!secret) {
        const message = 'JWT_SECRET environment variable is required';
        if (process.env.NODE_ENV === 'production') {
            throw new Error(message);
        }
        console.error(`❌ ${message}`);
        process.exit(1);
    }
    
    return secret;
}
