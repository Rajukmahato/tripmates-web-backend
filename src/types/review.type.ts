import { z } from "zod";

/**
 * Review Type Schema
 * Used for ratings and reviews between trip partners
 */
export const ReviewSchema = z.object({
  reviewer: z.string().min(1, "Reviewer ID is required"),
  reviewee: z.string().min(1, "Reviewee ID is required"),
  trip: z.string().min(1, "Trip ID is required"),
  rating: z.number().min(1, "Rating must be at least 1").max(5, "Rating cannot exceed 5"),
  comment: z.string().max(500, "Comment too long (max 500 characters)").optional(),
  createdAt: z.date().optional(),
});

export type ReviewType = z.infer<typeof ReviewSchema>;
