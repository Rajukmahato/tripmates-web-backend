import { Router } from "express";
import { reportController } from "../controllers/report.controller";
import { authorizedMiddleware } from "../middlewares/auth.middleware";
import { adminMiddleware } from "../middlewares/admin.middleware";

const router = Router();

// User routes (require authentication)
/**
 * @route   POST /api/reports
 * @desc    Submit a report against a user
 * @access  Private
 */
router.post("/", authorizedMiddleware, (req, res) => reportController.submitReport(req, res));

// Admin routes
/**
 * @route   GET /api/reports/admin/stats
 * @desc    Get report statistics (admin)
 * @access  Private (Admin only)
 */
router.get("/admin/stats", authorizedMiddleware, adminMiddleware, (req, res) =>
    reportController.getReportStats(req, res)
);

/**
 * @route   GET /api/reports/admin/all
 * @desc    Get all reports with optional status filter (admin)
 * @access  Private (Admin only)
 */
router.get("/admin/all", authorizedMiddleware, adminMiddleware, (req, res) =>
    reportController.getAllReports(req, res)
);

/**
 * @route   GET /api/reports/admin/:id
 * @desc    Get report by ID (admin)
 * @access  Private (Admin only)
 */
router.get("/admin/:id", authorizedMiddleware, adminMiddleware, (req, res) =>
    reportController.getReportById(req, res)
);

/**
 * @route   GET /api/reports/admin/user/:userId
 * @desc    Get reports for a specific user (admin)
 * @access  Private (Admin only)
 */
router.get("/admin/user/:userId", authorizedMiddleware, adminMiddleware, (req, res) =>
    reportController.getReportsForUser(req, res)
);

/**
 * @route   PUT /api/reports/admin/:id/review
 * @desc    Review a report (admin)
 * @access  Private (Admin only)
 */
router.put("/admin/:id/review", authorizedMiddleware, adminMiddleware, (req, res) =>
    reportController.reviewReport(req, res)
);

/**
 * @route   PUT /api/reports/admin/:id/resolve
 * @desc    Resolve a report (admin)
 * @access  Private (Admin only)
 */
router.put("/admin/:id/resolve", authorizedMiddleware, adminMiddleware, (req, res) =>
    reportController.resolveReport(req, res)
);

export default router;
