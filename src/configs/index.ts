import dotenv from 'dotenv';
dotenv.config();

export const PORT: number = process.env.PORT ? parseInt(process.env.PORT) : 5050;
export const MONGODB_URI: string = process.env.MONGODB_URI || 'mongodb://localhost:27017/default_db';
export const JWT_SECRET: string = process.env.JWT_SECRET || 'Raju@123';
export const EMAIL_HOST: string = process.env.EMAIL_HOST || 'smtp.gmail.com';
export const EMAIL_PORT: number = process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT) : 587;
export const EMAIL_USER: string = process.env.EMAIL_USER || '';
export const EMAIL_PASSWORD: string = process.env.EMAIL_PASSWORD || '';
export const EMAIL_FROM: string = process.env.EMAIL_FROM || 'noreply@tripmates.com';
export const FRONTEND_URL: string = process.env.FRONTEND_URL || 'http://localhost:3000';
