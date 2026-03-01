import { z } from "zod";

/**
 * DTO for submitting a review
 */
export const CreateReviewDto = z.object({
  revieweeId: z.string().min(1, "Reviewee ID is required"),
  tripId: z.string().min(1, "Trip ID is required"),
  rating: z.number().min(1, "Rating must be at least 1").max(5, "Rating cannot exceed 5"),
  comment: z.string().max(500, "Comment too long (max 500 characters)").optional(),
});

export type CreateReviewDto = z.infer<typeof CreateReviewDto>;

/**
 * DTO for querying reviews
 */
export const GetReviewsQueryDto = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
});

export type GetReviewsQueryDto = z.infer<typeof GetReviewsQueryDto>;
