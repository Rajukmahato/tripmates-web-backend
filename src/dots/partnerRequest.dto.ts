import { z } from "zod";

/**
 * ✅ Create Partner Request DTO
 * Used when sending a join request to a trip
 */
export const CreatePartnerRequestDto = z.object({
  tripId: z.string().min(1, "Trip ID is required"),
  message: z.string().max(500, "Message must be less than 500 characters").optional(),
});

export type CreatePartnerRequestDto = z.infer<typeof CreatePartnerRequestDto>;

/**
 * ✅ Update Partner Request Status DTO
 * Used for accepting or rejecting requests
 */
export const UpdatePartnerRequestStatusDto = z.object({
  status: z.enum(["accepted", "rejected"], {
    message: "Status must be either 'accepted' or 'rejected'",
  }),
});

export type UpdatePartnerRequestStatusDto = z.infer<typeof UpdatePartnerRequestStatusDto>;

/**
 * ✅ Get Partner Requests Query DTO
 * Used for filtering requests with pagination
 */
export const GetPartnerRequestsQueryDto = z.object({
  status: z.enum(["pending", "accepted", "rejected"]).optional(),
  page: z.string().optional().default("1").transform(Number).pipe(z.number().int().positive()),
  limit: z.string().optional().default("10").transform(Number).pipe(z.number().int().positive()),
});

export type GetPartnerRequestsQueryDto = z.infer<typeof GetPartnerRequestsQueryDto>;
