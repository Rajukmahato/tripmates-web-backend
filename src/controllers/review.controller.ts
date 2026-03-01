import { Request, Response } from "express";
import { reviewService } from "../services/review.service";
import { CreateReviewDto } from "../dots/review.dto";
import { HttpError } from "../errors/http-error";

export class ReviewController {
    /**
     * Submit a review for a trip partner
     * POST /api/reviews
     * Body: { revieweeId: string, tripId: string, rating: number, comment?: string }
     */
    async submitReview(req: Request, res: Response) {
        try {
            const userId = req.user?._id.toString();
            if (!userId) {
                throw new HttpError(401, "User not authenticated");
            }

            const validatedData = CreateReviewDto.parse(req.body);
            const { revieweeId, tripId, rating, comment } = validatedData;

            const review = await reviewService.submitReview(userId, revieweeId, tripId, rating, comment);

            res.status(201).json({
                success: true,
                message: "Review submitted successfully",
                data: review,
            });
        } catch (error: any) {
            res.status(error.statusCode || 400).json({
                success: false,
                message: error.message || "Failed to submit review",
            });
        }
    }

    /**
     * Get reviews for a specific user
     * GET /api/reviews/user/:userId?page=1&limit=10
     */
    async getReviewsForUser(req: Request, res: Response) {
        try {
            const revieweeId = req.params.userId;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;

            const result = await reviewService.getReviewsForUser(revieweeId, page, limit);

            res.status(200).json({
                success: true,
                message: "Reviews retrieved successfully",
                data: result,
            });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || "Failed to get reviews",
            });
        }
    }

    /**
     * Get reviews received by current user
     * GET /api/reviews/my?page=1&limit=10
     */
    async getMyReviews(req: Request, res: Response) {
        try {
            const userId = req.user?._id.toString();
            if (!userId) {
                throw new HttpError(401, "User not authenticated");
            }

            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;

            const result = await reviewService.getMyReviews(userId, page, limit);

            res.status(200).json({
                success: true,
                message: "Your reviews retrieved successfully",
                data: result,
            });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || "Failed to get your reviews",
            });
        }
    }

    /**
     * Get all reviews (admin)
     * GET /api/admin/reviews?page=1&limit=10
     */
    async getAllReviews(req: Request, res: Response) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;

            const result = await reviewService.getAllReviews(page, limit);

            res.status(200).json({
                success: true,
                message: "All reviews retrieved successfully",
                data: result,
            });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || "Failed to get reviews",
            });
        }
    }

    /**
     * Delete a review (admin)
     * DELETE /api/admin/reviews/:id
     */
    async deleteReview(req: Request, res: Response) {
        try {
            const reviewId = req.params.id;

            const result = await reviewService.deleteReview(reviewId);

            res.status(200).json({
                success: true,
                message: result.message,
            });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || "Failed to delete review",
            });
        }
    }

    /**
     * Get review statistics (admin)
     * GET /api/reviews/admin/stats
     */
    async getReviewStats(req: Request, res: Response) {
        try {
            const stats = await reviewService.getReviewStats();

            res.status(200).json({
                success: true,
                message: "Review statistics retrieved successfully",
                data: stats,
            });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || "Failed to get review statistics",
            });
        }
    }
}

export const reviewController = new ReviewController();
