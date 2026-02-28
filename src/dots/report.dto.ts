import { z } from "zod";

/**
 * DTO for submitting a report
 */
export const CreateReportDto = z.object({
  reportedUserId: z.string().min(1, "Reported user ID is required"),
  reason: z.string().min(1, "Reason is required").max(200, "Reason too long (max 200 characters)"),
  description: z.string().max(1000, "Description too long (max 1000 characters)").optional(),
});

export type CreateReportDto = z.infer<typeof CreateReportDto>;

/**
 * DTO for admin to review a report
 */
export const ReviewReportDto = z.object({
  adminNote: z.string().min(1, "Admin note is required").max(1000, "Admin note too long (max 1000 characters)"),
});

export type ReviewReportDto = z.infer<typeof ReviewReportDto>;

/**
 * DTO for admin to resolve a report
 */
export const ResolveReportDto = z.object({
  adminNote: z.string().max(1000, "Admin note too long (max 1000 characters)").optional(),
});

export type ResolveReportDto = z.infer<typeof ResolveReportDto>;

/**
 * DTO for querying reports (admin)
 */
export const GetReportsQueryDto = z.object({
  status: z.enum(["pending", "reviewed", "resolved"]).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
});

export type GetReportsQueryDto = z.infer<typeof GetReportsQueryDto>;
