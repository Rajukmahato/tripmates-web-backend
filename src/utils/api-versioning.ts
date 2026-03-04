/**
 * API Versioning Configuration
 * Manages API versions and deprecation
 */

export const API_VERSION = '1.0.0';

export enum ApiEndpointVersion {
    V1 = 'v1',
    V2 = 'v2',
}

/**
 * API versioning middleware
 * Adds API version to request and validates version
 */
export const apiVersionMiddleware = (req: any, res: any, next: any) => {
    // Extract version from Accept header or query param
    const versionFromHeader = req.headers['api-version'];
    const versionFromQuery = req.query['api-version'];
    const version = versionFromHeader || versionFromQuery || ApiEndpointVersion.V1;

    // Validate version
    const validVersions = Object.values(ApiEndpointVersion);
    if (!validVersions.includes(version)) {
        (req as any).apiVersion = ApiEndpointVersion.V1;
    } else {
        (req as any).apiVersion = version;
    }

    next();
};

/**
 * Supported endpoints by version
 * Maps endpoints to their supported API versions
 */
export const endpointVersionMap: Record<string, string[]> = {
    // Auth endpoints
    '/api/v1/auth/login': [ApiEndpointVersion.V1],
    '/api/v1/auth/register': [ApiEndpointVersion.V1],
    '/api/v1/auth/forgot-password': [ApiEndpointVersion.V1],
    '/api/v1/auth/reset-password': [ApiEndpointVersion.V1],

    // User endpoints
    '/api/v1/user/profile': [ApiEndpointVersion.V1],
    '/api/v1/user/update': [ApiEndpointVersion.V1],

    // Trip endpoints
    '/api/v1/trips': [ApiEndpointVersion.V1],
    '/api/v1/trips/:id': [ApiEndpointVersion.V1],

    // Partner request endpoints
    '/api/v1/partner-requests': [ApiEndpointVersion.V1],

    // Chat endpoints
    '/api/v1/chat': [ApiEndpointVersion.V1],

    // Review endpoints
    '/api/v1/reviews': [ApiEndpointVersion.V1],

    // Notification endpoints
    '/api/v1/notifications': [ApiEndpointVersion.V1],

    // Admin endpoints
    '/api/v1/admin/users': [ApiEndpointVersion.V1],
};

/**
 * Endpoint deprecation information
 * Tracks deprecated endpoints and their replacements
 */
export const deprecatedEndpoints: Record<string, {
    replacedBy?: string;
    deprecatedSince: string;
    sunsetDate: string;
    reason: string;
}> = {
    // Example: endpoints that are deprecated
    // '/api/v1/auth/logout': {
    //     replacedBy: '/api/v2/auth/logout',
    //     deprecatedSince: '2026-01-01',
    //     sunsetDate: '2026-03-01',
    //     reason: 'Improved endpoint with better error handling',
    // },
};

/**
 * Check if endpoint is deprecated
 */
export const isEndpointDeprecated = (endpoint: string): boolean => {
    return endpoint in deprecatedEndpoints;
};

/**
 * Get deprecation warning for endpoint
 */
export const getDeprecationWarning = (endpoint: string): string | null => {
    if (!isEndpointDeprecated(endpoint)) {
        return null;
    }

    const data = deprecatedEndpoints[endpoint];
    let warning = `This endpoint is deprecated since ${data.deprecatedSince}. `;

    if (data.replacedBy) {
        warning += `Use ${data.replacedBy} instead. `;
    }

    warning += `It will be removed on ${data.sunsetDate}. Reason: ${data.reason}`;

    return warning;
};
