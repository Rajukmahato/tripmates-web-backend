import { Router } from "express";
import { reviewController } from "../controllers/review.controller";
import { authorizedMiddleware } from "../middlewares/auth.middleware";
import { adminMiddleware } from "../middlewares/admin.middleware";

const router = Router();

// User routes (require authentication)
/**
 * @route   POST /api/reviews
 * @desc    Submit a review for a trip partner
 * @access  Private
 */
router.post("/", authorizedMiddleware, (req, res) => reviewController.submitReview(req, res));

/**
 * @route   GET /api/reviews/user/:userId
 * @desc    Get reviews for a specific user
 * @access  Public
 */
router.get("/user/:userId", (req, res) => reviewController.getReviewsForUser(req, res));

/**
 * @route   GET /api/reviews/my
 * @desc    Get reviews received by current user
 * @access  Private
 */
router.get("/my", authorizedMiddleware, (req, res) => reviewController.getMyReviews(req, res));

// Admin routes
/**
 * @route   GET /api/reviews/admin/stats
 * @desc    Get review statistics (admin)
 * @access  Private (Admin only)
 */
router.get("/admin/stats", authorizedMiddleware, adminMiddleware, (req, res) =>
    reviewController.getReviewStats(req, res)
);

/**
 * @route   GET /api/reviews/admin/all
 * @desc    Get all reviews (admin)
 * @access  Private (Admin only)
 */
router.get("/admin/all", authorizedMiddleware, adminMiddleware, (req, res) =>
    reviewController.getAllReviews(req, res)
);

/**
 * @route   DELETE /api/reviews/admin/:id
 * @desc    Delete a review (admin)
 * @access  Private (Admin only)
 */
router.delete("/admin/:id", authorizedMiddleware, adminMiddleware, (req, res) =>
    reviewController.deleteReview(req, res)
);

export default router;
