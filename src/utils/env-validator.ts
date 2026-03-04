/**
 * Environment variable validation and configuration
 * Ensures all required env vars are present in production
 */

const requiredEnvVars = [
    'JWT_SECRET',
    'MONGODB_URI',
    'EMAIL_HOST',
    'EMAIL_PORT',
    'EMAIL_USER',
    'EMAIL_PASSWORD',
];

const optionalEnvVars = [
    'FRONTEND_URL',
    'EMAIL_FROM',
    'GOOGLE_MAPS_API_KEY',
];

/**
 * Validate that all required environment variables are set
 * @throws Error if required env vars are missing in production
 */
export const validateEnvironment = (): void => {
    const isProduction = process.env.NODE_ENV === 'production';
    const missing: string[] = [];

    requiredEnvVars.forEach((envVar) => {
        if (!process.env[envVar]) {
            missing.push(envVar);
        }
    });

    if (missing.length > 0) {
        const message = `Missing required environment variables: ${missing.join(', ')}`;
        if (isProduction) {
            throw new Error(message);
        } else {
            console.warn(`⚠️ WARNING: ${message}`);
        }
    }

    // Validate JWT_SECRET is strong enough
    const jwtSecret = process.env.JWT_SECRET;
    if (jwtSecret && jwtSecret.length < 32 && isProduction) {
        throw new Error('JWT_SECRET must be at least 32 characters long in production');
    }
};

/**
 * Log loaded environment variables (excluding sensitive values)
 */
export const logEnvironmentSetup = (): void => {
    console.log('\n📋 Environment Configuration:');
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   PORT: ${process.env.PORT || '5050'}`);
    console.log(`   DATABASE: ${process.env.MONGODB_URI?.split('@')[0]?.substring(0, 30)}...`);
    console.log(`   EMAIL: Configured (${process.env.EMAIL_USER})`);
    console.log(`   FRONTEND: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    console.log('');
};
