import { z } from "zod";

/**
 * Report Type Schema
 * Used for user reports and complaints
 */
export const ReportSchema = z.object({
  reporter: z.string().min(1, "Reporter ID is required"),
  reportedUser: z.string().min(1, "Reported user ID is required"),
  reason: z.string().min(1, "Reason is required"),
  description: z.string().optional(),
  status: z.enum(["pending", "reviewed", "resolved"]).default("pending"),
  adminNote: z.string().optional(),
  createdAt: z.date().optional(),
});

export type ReportType = z.infer<typeof ReportSchema>;
