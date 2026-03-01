import mongoose from "mongoose";
import { ReviewModel, IReview } from "../modules/review.model";

export class ReviewRepository {
    /**
     * Create a new review
     */
    async create(
        reviewerId: string,
        revieweeId: string,
        tripId: string,
        rating: number,
        comment?: string
    ): Promise<IReview> {
        const review = await ReviewModel.create({
            reviewer: new mongoose.Types.ObjectId(reviewerId),
            reviewee: new mongoose.Types.ObjectId(revieweeId),
            trip: new mongoose.Types.ObjectId(tripId),
            rating,
            comment: comment || "",
        });

        return review;
    }

    /**
     * Check if review already exists
     */
    async exists(reviewerId: string, tripId: string): Promise<boolean> {
        const review = await ReviewModel.findOne({
            reviewer: new mongoose.Types.ObjectId(reviewerId),
            trip: new mongoose.Types.ObjectId(tripId),
        });

        return !!review;
    }

    /**
     * Find reviews for a user (reviews they received)
     */
    async findByReviewee(
        revieweeId: string,
        page: number = 1,
        limit: number = 10
    ): Promise<{ reviews: IReview[]; total: number; pages: number; averageRating: number }> {
        const skip = (page - 1) * limit;

        const [reviews, total, avgRating] = await Promise.all([
            ReviewModel.find({ reviewee: new mongoose.Types.ObjectId(revieweeId) })
                .populate("reviewer", "fullName profileImagePath")
                .populate("trip", "destination startDate endDate")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            ReviewModel.countDocuments({ reviewee: new mongoose.Types.ObjectId(revieweeId) }),
            ReviewModel.aggregate([
                { $match: { reviewee: new mongoose.Types.ObjectId(revieweeId) } },
                { $group: { _id: null, avgRating: { $avg: "$rating" } } },
            ]),
        ]);

        return {
            reviews,
            total,
            pages: Math.ceil(total / limit),
            averageRating: avgRating.length > 0 ? Math.round(avgRating[0].avgRating * 10) / 10 : 0,
        };
    }

    /**
     * Find all reviews (admin)
     */
    async findAll(
        page: number = 1,
        limit: number = 10
    ): Promise<{ reviews: IReview[]; total: number; pages: number }> {
        const skip = (page - 1) * limit;

        const [reviews, total] = await Promise.all([
            ReviewModel.find()
                .populate("reviewer", "fullName email profileImagePath")
                .populate("reviewee", "fullName email profileImagePath")
                .populate("trip", "destination startDate endDate")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            ReviewModel.countDocuments(),
        ]);

        return {
            reviews,
            total,
            pages: Math.ceil(total / limit),
        };
    }

    /**
     * Find review by ID
     */
    async findById(reviewId: string): Promise<IReview | null> {
        return await ReviewModel.findById(reviewId)
            .populate("reviewer", "fullName profileImagePath")
            .populate("reviewee", "fullName profileImagePath")
            .populate("trip", "destination startDate endDate");
    }

    /**
     * Delete review (admin)
     */
    async delete(reviewId: string): Promise<boolean> {
        const result = await ReviewModel.findByIdAndDelete(reviewId);
        return !!result;
    }

    /**
     * Get reviews given by a reviewer
     */
    async findByReviewer(
        reviewerId: string,
        page: number = 1,
        limit: number = 10
    ): Promise<{ reviews: IReview[]; total: number; pages: number }> {
        const skip = (page - 1) * limit;

        const [reviews, total] = await Promise.all([
            ReviewModel.find({ reviewer: new mongoose.Types.ObjectId(reviewerId) })
                .populate("reviewee", "fullName profileImagePath")
                .populate("trip", "destination startDate endDate")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            ReviewModel.countDocuments({ reviewer: new mongoose.Types.ObjectId(reviewerId) }),
        ]);

        return {
            reviews,
            total,
            pages: Math.ceil(total / limit),
        };
    }

    /**
     * Get review statistics (admin)
     */
    async getStats(): Promise<{ totalReviews: number; averageRating: number; pendingReviews: number }> {
        const [total, avgRating] = await Promise.all([
            ReviewModel.countDocuments(),
            ReviewModel.aggregate([
                { $group: { _id: null, avgRating: { $avg: "$rating" } } },
            ]),
        ]);

        return {
            totalReviews: total,
            averageRating: avgRating.length > 0 ? Math.round(avgRating[0].avgRating * 10) / 10 : 0,
            pendingReviews: 0, // Reviews don't have pending status in current schema
        };
    }
}

export const reviewRepository = new ReviewRepository();
