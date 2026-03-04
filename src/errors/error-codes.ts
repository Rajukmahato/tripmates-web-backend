/**
 * Standardized Error Codes
 * Provides consistent error codes across the API
 */

export enum ErrorCode {
    // Authentication Errors (1000-1099)
    AUTH_INVALID_CREDENTIALS = 'AUTH_001',
    AUTH_TOKEN_EXPIRED = 'AUTH_002',
    AUTH_TOKEN_INVALID = 'AUTH_003',
    AUTH_MISSING_TOKEN = 'AUTH_004',
    AUTH_UNAUTHORIZED = 'AUTH_005',
    AUTH_ACCOUNT_LOCKED = 'AUTH_006',
    AUTH_2FA_REQUIRED = 'AUTH_007',
    AUTH_EMAIL_NOT_VERIFIED = 'AUTH_008',

    // Validation Errors (2000-2099)
    VALIDATION_FAILED = 'VAL_001',
    VALIDATION_INVALID_EMAIL = 'VAL_002',
    VALIDATION_INVALID_PHONE = 'VAL_003',
    VALIDATION_PASSWORD_WEAK = 'VAL_004',
    VALIDATION_DUPLICATE_EMAIL = 'VAL_005',
    VALIDATION_DUPLICATE_PHONE = 'VAL_006',
    VALIDATION_INVALID_FILE = 'VAL_007',
    VALIDATION_FILE_TOO_LARGE = 'VAL_008',

    // Resource Not Found (3000-3099)
    NOT_FOUND_USER = 'NOT_001',
    NOT_FOUND_TRIP = 'NOT_002',
    NOT_FOUND_MESSAGE = 'NOT_003',
    NOT_FOUND_REVIEW = 'NOT_004',
    NOT_FOUND_REQUEST = 'NOT_005',
    NOT_FOUND_NOTIFICATION = 'NOT_006',
    NOT_FOUND_RESOURCE = 'NOT_007',

    // Conflict/Already Exists (4000-4099)
    CONFLICT_DUPLICATE_REQUEST = 'CONF_001',
    CONFLICT_ALREADY_REVIEWED = 'CONF_002',
    CONFLICT_TRIP_FULL = 'CONF_003',
    CONFLICT_ALREADY_MEMBER = 'CONF_004',
    CONFLICT_USER_BLOCKED = 'CONF_005',
    CONFLICT_ALREADY_EXISTS = 'CONF_006',

    // Permission/Authorization Errors (5000-5099)
    FORBIDDEN_NO_PERMISSION = 'PERM_001',
    FORBIDDEN_ADMIN_ONLY = 'PERM_002',
    FORBIDDEN_SELF_ACTION = 'PERM_003',
    FORBIDDEN_NOT_OWNER = 'PERM_004',
    FORBIDDEN_ARCHIVED = 'PERM_005',

    // Rate Limiting (6000-6099)
    RATE_LIMIT_EXCEEDED = 'RATE_001',
    RATE_LIMIT_AUTH = 'RATE_002',
    RATE_LIMIT_API = 'RATE_003',
    RATE_LIMIT_CHAT = 'RATE_004',

    // Data Errors (7000-7099)
    DATA_INTEGRITY_ERROR = 'DATA_001',
    DATA_INCONSISTENCY = 'DATA_002',
    DATA_CORRUPTION = 'DATA_003',

    // External Service Errors (8000-8099)
    EXTERNAL_EMAIL_FAILED = 'EXT_001',
    EXTERNAL_PAYMENT_FAILED = 'EXT_002',
    EXTERNAL_FILE_STORAGE_FAILED = 'EXT_003',
    EXTERNAL_FIREBASE_ERROR = 'EXT_004',

    // Server Errors (9000-9099)
    INTERNAL_SERVER_ERROR = 'SERVER_001',
    SERVICE_UNAVAILABLE = 'SERVER_002',
    DATABASE_ERROR = 'SERVER_003',
    UNKNOWN_ERROR = 'SERVER_004',
}

/**
 * Error code to HTTP status code mapping
 */
export const errorCodeToStatusCode: Record<ErrorCode, number> = {
    // Authentication
    [ErrorCode.AUTH_INVALID_CREDENTIALS]: 401,
    [ErrorCode.AUTH_TOKEN_EXPIRED]: 401,
    [ErrorCode.AUTH_TOKEN_INVALID]: 401,
    [ErrorCode.AUTH_MISSING_TOKEN]: 401,
    [ErrorCode.AUTH_UNAUTHORIZED]: 401,
    [ErrorCode.AUTH_ACCOUNT_LOCKED]: 423,
    [ErrorCode.AUTH_2FA_REQUIRED]: 403,
    [ErrorCode.AUTH_EMAIL_NOT_VERIFIED]: 403,

    // Validation
    [ErrorCode.VALIDATION_FAILED]: 400,
    [ErrorCode.VALIDATION_INVALID_EMAIL]: 400,
    [ErrorCode.VALIDATION_INVALID_PHONE]: 400,
    [ErrorCode.VALIDATION_PASSWORD_WEAK]: 400,
    [ErrorCode.VALIDATION_DUPLICATE_EMAIL]: 409,
    [ErrorCode.VALIDATION_DUPLICATE_PHONE]: 409,
    [ErrorCode.VALIDATION_INVALID_FILE]: 400,
    [ErrorCode.VALIDATION_FILE_TOO_LARGE]: 413,

    // Not Found
    [ErrorCode.NOT_FOUND_USER]: 404,
    [ErrorCode.NOT_FOUND_TRIP]: 404,
    [ErrorCode.NOT_FOUND_MESSAGE]: 404,
    [ErrorCode.NOT_FOUND_REVIEW]: 404,
    [ErrorCode.NOT_FOUND_REQUEST]: 404,
    [ErrorCode.NOT_FOUND_NOTIFICATION]: 404,
    [ErrorCode.NOT_FOUND_RESOURCE]: 404,

    // Conflict
    [ErrorCode.CONFLICT_DUPLICATE_REQUEST]: 409,
    [ErrorCode.CONFLICT_ALREADY_REVIEWED]: 409,
    [ErrorCode.CONFLICT_TRIP_FULL]: 409,
    [ErrorCode.CONFLICT_ALREADY_MEMBER]: 409,
    [ErrorCode.CONFLICT_USER_BLOCKED]: 403,
    [ErrorCode.CONFLICT_ALREADY_EXISTS]: 409,

    // Permission
    [ErrorCode.FORBIDDEN_NO_PERMISSION]: 403,
    [ErrorCode.FORBIDDEN_ADMIN_ONLY]: 403,
    [ErrorCode.FORBIDDEN_SELF_ACTION]: 400,
    [ErrorCode.FORBIDDEN_NOT_OWNER]: 403,
    [ErrorCode.FORBIDDEN_ARCHIVED]: 410,

    // Rate Limiting
    [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,
    [ErrorCode.RATE_LIMIT_AUTH]: 429,
    [ErrorCode.RATE_LIMIT_API]: 429,
    [ErrorCode.RATE_LIMIT_CHAT]: 429,

    // Data
    [ErrorCode.DATA_INTEGRITY_ERROR]: 500,
    [ErrorCode.DATA_INCONSISTENCY]: 500,
    [ErrorCode.DATA_CORRUPTION]: 500,

    // External
    [ErrorCode.EXTERNAL_EMAIL_FAILED]: 502,
    [ErrorCode.EXTERNAL_PAYMENT_FAILED]: 502,
    [ErrorCode.EXTERNAL_FILE_STORAGE_FAILED]: 502,
    [ErrorCode.EXTERNAL_FIREBASE_ERROR]: 502,

    // Server
    [ErrorCode.INTERNAL_SERVER_ERROR]: 500,
    [ErrorCode.SERVICE_UNAVAILABLE]: 503,
    [ErrorCode.DATABASE_ERROR]: 500,
    [ErrorCode.UNKNOWN_ERROR]: 500,
};

/**
 * Get HTTP status code for error code
 */
export const getStatusCodeForError = (errorCode: ErrorCode): number => {
    return errorCodeToStatusCode[errorCode] || 500;
};

/**
 * Error code to message mapping
 */
export const errorCodeToMessage: Record<ErrorCode, string> = {
    // Authentication
    [ErrorCode.AUTH_INVALID_CREDENTIALS]: 'Invalid email or password',
    [ErrorCode.AUTH_TOKEN_EXPIRED]: 'Your session has expired. Please log in again.',
    [ErrorCode.AUTH_TOKEN_INVALID]: 'Invalid authentication token',
    [ErrorCode.AUTH_MISSING_TOKEN]: 'Authentication token is required',
    [ErrorCode.AUTH_UNAUTHORIZED]: 'You are not authorized to access this resource',
    [ErrorCode.AUTH_ACCOUNT_LOCKED]: 'Your account has been locked due to multiple failed login attempts',
    [ErrorCode.AUTH_2FA_REQUIRED]: 'Two-factor authentication is required',
    [ErrorCode.AUTH_EMAIL_NOT_VERIFIED]: 'Please verify your email to proceed',

    // Validation
    [ErrorCode.VALIDATION_FAILED]: 'Input validation failed',
    [ErrorCode.VALIDATION_INVALID_EMAIL]: 'Invalid email address',
    [ErrorCode.VALIDATION_INVALID_PHONE]: 'Invalid phone number',
    [ErrorCode.VALIDATION_PASSWORD_WEAK]: 'Password does not meet complexity requirements',
    [ErrorCode.VALIDATION_DUPLICATE_EMAIL]: 'This email is already in use',
    [ErrorCode.VALIDATION_DUPLICATE_PHONE]: 'This phone number is already in use',
    [ErrorCode.VALIDATION_INVALID_FILE]: 'Invalid file type or format',
    [ErrorCode.VALIDATION_FILE_TOO_LARGE]: 'File size exceeds maximum allowed limit',

    // Not Found
    [ErrorCode.NOT_FOUND_USER]: 'User not found',
    [ErrorCode.NOT_FOUND_TRIP]: 'Trip not found',
    [ErrorCode.NOT_FOUND_MESSAGE]: 'Message not found',
    [ErrorCode.NOT_FOUND_REVIEW]: 'Review not found',
    [ErrorCode.NOT_FOUND_REQUEST]: 'Request not found',
    [ErrorCode.NOT_FOUND_NOTIFICATION]: 'Notification not found',
    [ErrorCode.NOT_FOUND_RESOURCE]: 'Resource not found',

    // Conflict
    [ErrorCode.CONFLICT_DUPLICATE_REQUEST]: 'You have already sent a request for this trip',
    [ErrorCode.CONFLICT_ALREADY_REVIEWED]: 'You have already reviewed this user',
    [ErrorCode.CONFLICT_TRIP_FULL]: 'This trip has reached its maximum capacity',
    [ErrorCode.CONFLICT_ALREADY_MEMBER]: 'You are already a member of this trip',
    [ErrorCode.CONFLICT_USER_BLOCKED]: 'This user has blocked you',
    [ErrorCode.CONFLICT_ALREADY_EXISTS]: 'This resource already exists',

    // Permission
    [ErrorCode.FORBIDDEN_NO_PERMISSION]: 'You do not have permission to perform this action',
    [ErrorCode.FORBIDDEN_ADMIN_ONLY]: 'This action requires admin privileges',
    [ErrorCode.FORBIDDEN_SELF_ACTION]: 'You cannot perform this action on yourself',
    [ErrorCode.FORBIDDEN_NOT_OWNER]: 'You can only manage your own resources',
    [ErrorCode.FORBIDDEN_ARCHIVED]: 'This resource has been archived and cannot be modified',

    // Rate Limiting
    [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please try again later.',
    [ErrorCode.RATE_LIMIT_AUTH]: 'Too many login attempts. Please try again later.',
    [ErrorCode.RATE_LIMIT_API]: 'API rate limit exceeded. Please slow down.',
    [ErrorCode.RATE_LIMIT_CHAT]: 'Messaging rate limit exceeded. Please slow down.',

    // Data
    [ErrorCode.DATA_INTEGRITY_ERROR]: 'Data integrity error. Please try again.',
    [ErrorCode.DATA_INCONSISTENCY]: 'Data inconsistency detected. Please contact support.',
    [ErrorCode.DATA_CORRUPTION]: 'Data corruption detected. Please contact support.',

    // External
    [ErrorCode.EXTERNAL_EMAIL_FAILED]: 'Failed to send email. Please try again later.',
    [ErrorCode.EXTERNAL_PAYMENT_FAILED]: 'Payment processing failed. Please try again.',
    [ErrorCode.EXTERNAL_FILE_STORAGE_FAILED]: 'File storage service is unavailable. Please try again later.',
    [ErrorCode.EXTERNAL_FIREBASE_ERROR]: 'Third-party service error. Please try again later.',

    // Server
    [ErrorCode.INTERNAL_SERVER_ERROR]: 'An internal server error occurred',
    [ErrorCode.SERVICE_UNAVAILABLE]: 'Service is temporarily unavailable',
    [ErrorCode.DATABASE_ERROR]: 'Database error occurred',
    [ErrorCode.UNKNOWN_ERROR]: 'An unknown error occurred',
};
