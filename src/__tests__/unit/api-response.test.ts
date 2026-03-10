import { Request } from 'express';
import {
    successResponse,
    calculatePaginationInfo,
    attachRequestContext,
} from '../../utils/api-response';

describe('API Response Utilities', () => {
    it('should build standardized success response with data and requestId', () => {
        const payload = { id: 'trip-1', name: 'Weekend Trip' };
        const response = successResponse(200, 'Fetched successfully', payload, undefined, 'req-123');

        expect(response.success).toBe(true);
        expect(response.statusCode).toBe(200);
        expect(response.message).toBe('Fetched successfully');
        expect(response.data).toEqual(payload);
        expect(response.requestId).toBe('req-123');
        expect(response.apiVersion).toBe('1.0.0');
        expect(typeof response.timestamp).toBe('string');
    });

    it('should calculate pagination metadata correctly', () => {
        const pagination = calculatePaginationInfo(2, 10, 25);

        expect(pagination.page).toBe(2);
        expect(pagination.limit).toBe(10);
        expect(pagination.total).toBe(25);
        expect(pagination.pages).toBe(3);
        expect(pagination.hasMore).toBe(true);
    });

    it('should attach requestId from request context', () => {
        const baseResponse = successResponse(201, 'Created');
        const req = { requestId: 'ctx-789' } as Request;

        const responseWithContext = attachRequestContext(baseResponse, req);

        expect(responseWithContext.requestId).toBe('ctx-789');
    });
});