import express, { Application, Request, Response } from 'express';
import bodyparser from 'body-parser'
import cors from 'cors';
import authRouters from "./routes/auth.route";
import userRouters from "./routes/user.route";
import adminRouters from "./routes/admin.route";
import tripRouters from "./routes/trip.route";
import partnerRequestRouters from "./routes/partnerRequest.route";
import chatRouters from "./routes/chat.route";
import reviewRouters from "./routes/review.route";
import reportRouters from "./routes/report.route";
import notificationRouters from "./routes/notification.route";
import destinationRouters from "./routes/destination.route";
import { CORS_OPTIONS } from './configs';
import { globalErrorHandler, notFoundHandler } from './middlewares/error-handler.middleware';
import { requestLogger, requestIdMiddleware } from './middlewares/logger.middleware';
import { globalLimiter, authLimiter } from './middlewares/rate-limit.middleware';

import { paginationMiddleware } from './middlewares/pagination.middleware';
import { apiVersionMiddleware } from './utils/api-versioning';
import { successResponse } from './utils/api-response';
import { initializeSentry } from './integrations/sentry';
import { setupMonitoring } from './middlewares/monitoring.middleware';
import { setupDashboardRoutes } from './routes/monitoring.route';

const app: Application = express();

// ===== SENTRY ERROR TRACKING INITIALIZATION =====

// Initialize Sentry for error tracking and performance monitoring
initializeSentry(app);

// ===== SECURITY MIDDLEWARE =====

// CORS configuration
app.use(cors(CORS_OPTIONS));

// Request ID generation
app.use(requestIdMiddleware);

// API Version detection
app.use(apiVersionMiddleware);

// ===== DATA PARSING MIDDLEWARE =====

// Body parsing with size limits
app.use(bodyparser.json({ limit: '10mb' }));
app.use(bodyparser.urlencoded({ limit: '10mb', extended: true }));

// ===== PAGINATION & STANDARD PROCESSING =====

// Pagination middleware for list endpoints
app.use(paginationMiddleware);

// ===== RATE LIMITING MIDDLEWARE =====

// Apply global rate limiter (100 requests per 15 minutes)
app.use(globalLimiter);

// ===== REQUEST LOGGING =====

app.use(requestLogger);

// ===== INTEGRATED MONITORING =====

// Setup comprehensive monitoring: error tracking, performance monitoring, alerting
setupMonitoring(app);

// ===== ROUTES =====

// API Routes with specific rate limiters
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/forgot-password", authLimiter);
app.use("/api/auth", authRouters);

app.use("/api/user", userRouters);
app.use("/api/admin", adminRouters);
app.use("/api/trips", tripRouters);
app.use("/api/partner-requests", partnerRequestRouters);
app.use("/api/chat", chatRouters);
app.use("/api/reviews", reviewRouters);
app.use("/api/reports", reportRouters);
app.use("/api/notifications", notificationRouters);
app.use("/api/destinations", destinationRouters);

// ===== MONITORING DASHBOARD API =====

// Setup monitoring dashboard endpoints
setupDashboardRoutes(app);

// ===== STATIC FILE SERVING WITH CORS =====

// Add CORS headers specifically for static files
app.use("/uploads", (req, res, next) => {
  const origin = req.get('origin') || req.get('referer');
  
  // Allow requests from configured CORS origins
  const allowedOrigins = Array.isArray(CORS_OPTIONS.origin) 
    ? CORS_OPTIONS.origin 
    : [CORS_OPTIONS.origin];
  
  // Check if origin is allowed
  if (origin && allowedOrigins.some(allowed => origin.includes(allowed.replace(/https?:\/\//, '')))) {
    res.header('Access-Control-Allow-Origin', req.get('origin') || '*');
  } else {
    // Default to wildcard for localhost development
    res.header('Access-Control-Allow-Origin', '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Serve static files
app.use("/uploads", express.static("uploads"));

// ===== API INFO ENDPOINTS =====

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
    const response = successResponse(
        200,
        "Server is healthy",
        {
            status: 'healthy',
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            timestamp: new Date().toISOString(),
        },
        undefined,
        (req as any).requestId
    );
    res.status(200).json(response);
});

// API info endpoint
app.get("/", (req: Request, res: Response) => {
    const response = successResponse(
        200,
        "Welcome to TripMates API",
        {
            version: "1.0.0",
            name: "TripMates Backend API",
            description: "A comprehensive travel companion platform",
            endpoints: {
                auth: "/api/auth",
                users: "/api/user",
                trips: "/api/trips",
                admin: "/api/admin",
                chat: "/api/chat",
                reviews: "/api/reviews",
                partner_requests: "/api/partner-requests",
                notifications: "/api/notifications",
                reports: "/api/reports",
                destinations: "/api/destinations",
            },
            documentation: "/docs",
            status: "operational",
        },
        undefined,
        (req as any).requestId
    );
    res.status(200).json(response);
});

// ===== ERROR HANDLING & 404 =====

// 404 handler (must be before error handler)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(globalErrorHandler);

export default app;
