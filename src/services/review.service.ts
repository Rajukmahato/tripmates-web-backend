import { reviewRepository } from "../repositories/review.repository";
import { PartnerRequestModel } from "../modules/partnerRequest.model";
import { IReview } from "../modules/review.model";
import { HttpError } from "../errors/http-error";
import { notificationService } from "./notification.service";
import mongoose from "mongoose";

export class ReviewService {
    /**
     * Verify that users were trip partners (accepted partner request)
     */
    private async verifyTripPartnership(
        reviewerId: string,
        revieweeId: string,
        tripId: string
    ): Promise<boolean> {
        // Check if there's an accepted partner request between these users for this trip
        const partnerRequest = await PartnerRequestModel.findOne({
            trip: new mongoose.Types.ObjectId(tripId),
            status: "accepted",
            $or: [
                {
                    sender: new mongoose.Types.ObjectId(reviewerId),
                    receiver: new mongoose.Types.ObjectId(revieweeId),
                },
                {
                    sender: new mongoose.Types.ObjectId(revieweeId),
                    receiver: new mongoose.Types.ObjectId(reviewerId),
                },
            ],
        });

        return !!partnerRequest;
    }

    /**
     * Submit a review for a trip partner
     */
    async submitReview(
        reviewerId: string,
        revieweeId: string,
        tripId: string,
        rating: number,
        comment?: string
    ): Promise<IReview> {
        // Validate input
        if (!revieweeId || !tripId) {
            throw new HttpError(400, "Reviewee ID and Trip ID are required");
        }

        if (reviewerId === revieweeId) {
            throw new HttpError(400, "Cannot review yourself");
        }

        if (rating < 1 || rating > 5) {
            throw new HttpError(400, "Rating must be between 1 and 5");
        }

        // Check if review already exists
        const reviewExists = await reviewRepository.exists(reviewerId, tripId);
        if (reviewExists) {
            throw new HttpError(400, "You have already reviewed this trip partner");
        }

        // Verify that users were trip partners
        const arePartners = await this.verifyTripPartnership(reviewerId, revieweeId, tripId);
        if (!arePartners) {
            throw new HttpError(
                403,
                "You can only review users you have traveled with (accepted partner request)"
            );
        }

        // Create review
        const review = await reviewRepository.create(reviewerId, revieweeId, tripId, rating, comment);

        // Populate fields
        await review.populate([
            { path: "reviewer", select: "fullName profileImagePath" },
            { path: "reviewee", select: "fullName profileImagePath" },
            { path: "trip", select: "destination startDate endDate" },
        ]);

        // Send notification to reviewee
        try {
            await notificationService.notifyNewReview(
                revieweeId,
                (review.reviewer as any).fullName,
                rating,
                review._id.toString()
            );
        } catch (error) {
            console.error("Failed to send review notification:", error);
        }

        return review;
    }

    /**
     * Get reviews for a user
     */
    async getReviewsForUser(
        revieweeId: string,
        page: number = 1,
        limit: number = 10
    ): Promise<{
        reviews: IReview[];
        total: number;
        pages: number;
        currentPage: number;
        averageRating: number;
    }> {
        const result = await reviewRepository.findByReviewee(revieweeId, page, limit);

        return {
            ...result,
            currentPage: page,
        };
    }

    /**
     * Get reviews received by current user
     */
    async getMyReviews(
        userId: string,
        page: number = 1,
        limit: number = 10
    ): Promise<{
        reviews: IReview[];
        total: number;
        pages: number;
        currentPage: number;
        averageRating: number;
    }> {
        return this.getReviewsForUser(userId, page, limit);
    }

    /**
     * Get all reviews (admin)
     */
    async getAllReviews(
        page: number = 1,
        limit: number = 10
    ): Promise<{ reviews: IReview[]; total: number; pages: number; currentPage: number }> {
        const result = await reviewRepository.findAll(page, limit);

        return {
            ...result,
            currentPage: page,
        };
    }

    /**
     * Delete a review (admin)
     */
    async deleteReview(reviewId: string): Promise<{ message: string }> {
        if (!mongoose.Types.ObjectId.isValid(reviewId)) {
            throw new HttpError(400, "Invalid review ID");
        }

        const review = await reviewRepository.findById(reviewId);
        if (!review) {
            throw new HttpError(404, "Review not found");
        }

        await reviewRepository.delete(reviewId);

        return { message: "Review deleted successfully" };
    }

    /**
     * Get review statistics (admin)
     */
    async getReviewStats(): Promise<{ totalReviews: number; averageRating: number; pendingReviews: number }> {
        return await reviewRepository.getStats();
    }
}

export const reviewService = new ReviewService();
