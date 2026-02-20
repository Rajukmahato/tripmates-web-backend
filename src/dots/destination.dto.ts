import { z } from "zod";

export const CreateDestinationDto = z.object({
    name: z.string().min(2, "Destination name must be at least 2 characters"),
    country: z.string().min(2, "Country must be at least 2 characters"),
    description: z.string().optional(),
    coverImage: z.string().optional(),
    attractions: z.array(z.string()).optional(),
    bestTimeToVisit: z.string().optional(),
    travelTips: z.array(z.string()).optional(),
});

export type CreateDestinationDto = z.infer<typeof CreateDestinationDto>;

export const UpdateDestinationDto = z.object({
    name: z.string().min(2, "Destination name must be at least 2 characters").optional(),
    country: z.string().min(2, "Country must be at least 2 characters").optional(),
    description: z.string().optional(),
    coverImage: z.string().optional(),
    attractions: z.array(z.string()).optional(),
    bestTimeToVisit: z.string().optional(),
    travelTips: z.array(z.string()).optional(),
});

export type UpdateDestinationDto = z.infer<typeof UpdateDestinationDto>;

export const UpdateDestinationStatusDto = z.object({
    isActive: z.boolean(),
});

export type UpdateDestinationStatusDto = z.infer<typeof UpdateDestinationStatusDto>;
