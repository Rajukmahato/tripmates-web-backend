import { z } from "zod";

/**
 * ✅ Base Trip Schema
 * Used for trip creation and validation
 */
export const TripBaseSchema = z.object({
  destination: z.string().min(3, "Destination must be at least 3 characters"),
  startDate: z.string().refine((date: string) => !isNaN(Date.parse(date)), {
    message: "Invalid start date format",
  }),
  endDate: z.string().refine((date: string) => !isNaN(Date.parse(date)), {
    message: "Invalid end date format",
  }),
  budget: z.number().positive("Budget must be a positive number"),
  travelType: z.enum(["adventure", "leisure", "business", "backpacking"], {
    message: "Invalid travel type",
  }),
  groupSize: z.number().int().positive("Group size must be a positive integer"),
  description: z.string().max(1000, "Description must be less than 1000 characters").optional(),
  status: z.enum(["open", "closed"]).default("open"),
});

/**
 * ✅ Trip Schema with date validation
 */
export const TripSchema = TripBaseSchema.refine(
  (data: any) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return end > start;
  },
  {
    message: "End date must be after start date",
    path: ["endDate"],
  }
).refine(
  (data: any) => {
    const start = new Date(data.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return start >= today;
  },
  {
    message: "Start date cannot be in the past",
    path: ["startDate"],
  }
);

export type TripType = z.infer<typeof TripSchema>;

/**
 * ✅ Trip with creator reference
 */
export interface ITripWithCreator extends TripType {
  creator: string; // User ObjectId
}
