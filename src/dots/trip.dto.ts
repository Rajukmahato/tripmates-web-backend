import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

/**
 * ✅ Create Trip DTO (Full validation) - Without status field
 * Handles both JSON and FormData inputs (FormData converts numbers to strings)
 * Flexible: Allows either existing destinationId OR custom destination string
 */
export const CreateTripDto = z.object({
  destination: z.string().min(3, "Destination must be at least 3 characters").optional(),
  destinationId: z.string().optional().refine(
    (val) => !val || val === "" || objectIdRegex.test(val),
    { message: "Invalid destination ID format" }
  ),
  startDate: z.string().refine((date: string) => !isNaN(Date.parse(date)), {
    message: "Invalid start date format",
  }),
  endDate: z.string().refine((date: string) => !isNaN(Date.parse(date)), {
    message: "Invalid end date format",
  }),
  budget: z.union([
    z.number().positive("Budget must be a positive number"),
    z.string().transform(Number).pipe(z.number().positive("Budget must be a positive number")),
  ]),
  travelType: z.enum(["adventure", "leisure", "business", "backpacking"], {
    message: "Invalid travel type",
  }),
  groupSize: z.union([
    z.number().int().positive("Group size must be a positive integer"),
    z.string().transform(Number).pipe(z.number().int().positive("Group size must be a positive integer")),
  ]),
  description: z.string().max(1000, "Description must be less than 1000 characters").optional().or(z.literal("")),
  image: z.string().url().optional().nullable(),
  images: z.array(z.string().url()).optional(),
}).refine(
  (data: any) => !!(data.destinationId || data.destination),
  {
    message: "Either destinationId (for existing) or destination (for custom) is required",
    path: ["destination"],
  }
).refine(
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

export type CreateTripDto = z.infer<typeof CreateTripDto>;

/**
 * ✅ Update Trip DTO (All fields optional)
 * Handles both JSON and FormData inputs
 * Flexible: Allows either existing destinationId OR custom destination string
 */
export const UpdateTripDto = z.object({
  destination: z.string().min(3).optional().or(z.literal("")),
  destinationId: z.string().optional().or(z.literal("")).refine(
    (val) => !val || val === "" || objectIdRegex.test(val),
    { message: "Invalid destination ID format" }
  ),
  startDate: z.string().refine((date: string) => !isNaN(Date.parse(date))).optional().or(z.literal("")),
  endDate: z.string().refine((date: string) => !isNaN(Date.parse(date))).optional().or(z.literal("")),
  budget: z.union([
    z.number().positive(),
    z.string().transform(Number).pipe(z.number().positive()),
  ]).optional().or(z.literal("")),
  travelType: z.enum(["adventure", "leisure", "business", "backpacking"]).optional().or(z.literal("")),
  groupSize: z.union([
    z.number().int().positive(),
    z.string().transform(Number).pipe(z.number().int().positive()),
  ]).optional().or(z.literal("")),
  description: z.string().max(1000).optional().or(z.literal("")),
  status: z.enum(["open", "closed"]).optional().or(z.literal("")),
  image: z.string().url().optional().nullable(),
  images: z.array(z.string().url()).optional(),
  // Additional optional fields (these will be allowed but not validated strictly)
  difficulty: z.string().optional().or(z.literal("")),
  distanceMin: z.union([z.number().nonnegative(), z.string().transform(Number).pipe(z.number().nonnegative())]).optional().or(z.literal("")),
  distanceMax: z.union([z.number().nonnegative(), z.string().transform(Number).pipe(z.number().nonnegative())]).optional().or(z.literal("")),
  durationMinHours: z.union([z.number().nonnegative(), z.string().transform(Number).pipe(z.number().nonnegative())]).optional().or(z.literal("")),
  durationMaxHours: z.union([z.number().nonnegative(), z.string().transform(Number).pipe(z.number().nonnegative())]).optional().or(z.literal("")),
  elevationMin: z.union([z.number().nonnegative(), z.string().transform(Number).pipe(z.number().nonnegative())]).optional().or(z.literal("")),
  elevationMax: z.union([z.number().nonnegative(), z.string().transform(Number).pipe(z.number().nonnegative())]).optional().or(z.literal("")),
  groupSizeMin: z.union([z.number().nonnegative(), z.string().transform(Number).pipe(z.number().nonnegative())]).optional().or(z.literal("")),
  groupSizeMax: z.union([z.number().nonnegative(), z.string().transform(Number).pipe(z.number().nonnegative())]).optional().or(z.literal("")),
  bestSeason: z.string().optional().or(z.literal("")),
  activities: z.string().optional().or(z.literal("")),
  highlights: z.string().optional().or(z.literal("")),
  guideIncluded: z.union([z.boolean(), z.string().transform(val => val === 'true')]).optional(),
  mealsIncluded: z.union([z.boolean(), z.string().transform(val => val === 'true')]).optional(),
  accommodationType: z.string().optional().or(z.literal("")),
}).refine(
  (data: any) => {
    if (data.startDate && data.endDate && data.startDate !== "" && data.endDate !== "") {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return end > start;
    }
    return true;
  },
  {
    message: "End date must be after start date",
    path: ["endDate"],
  }
);

export type UpdateTripDto = z.infer<typeof UpdateTripDto>;

/**
 * ✅ Search Trip DTO (Query parameters)
 */
export const SearchTripDto = z.object({
  destination: z.string().optional(),
  destinationId: z.string().regex(objectIdRegex, "Invalid destination ID format").optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  minBudget: z.string().transform(Number).pipe(z.number().positive()).optional(),
  maxBudget: z.string().transform(Number).pipe(z.number().positive()).optional(),
  travelType: z.enum(["adventure", "leisure", "business", "backpacking"]).optional(),
  status: z.enum(["open", "closed"]).optional(),
  page: z.string().optional().default("1").transform(Number).pipe(z.number().int().positive()),
  limit: z.string().optional().default("10").transform(Number).pipe(z.number().int().positive()),
});

export type SearchTripDto = z.infer<typeof SearchTripDto>;

/**
 * ✅ Admin Update Trip DTO (Can change status - same as UpdateTripDto)
 */
export const AdminUpdateTripDto = UpdateTripDto;

export type AdminUpdateTripDto = z.infer<typeof AdminUpdateTripDto>;
