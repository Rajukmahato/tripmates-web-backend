import { z } from "zod";

/**
 * ✅ Partner Request Status Enum
 */
export const PartnerRequestStatusSchema = z.enum(["pending", "accepted", "rejected"]);

export type PartnerRequestStatus = z.infer<typeof PartnerRequestStatusSchema>;

/**
 * ✅ Base Partner Request Schema
 */
export const PartnerRequestBaseSchema = z.object({
  trip: z.string().min(1, "Trip ID is required"),
  sender: z.string().min(1, "Sender ID is required"),
  receiver: z.string().min(1, "Receiver ID is required"),
  message: z.string().max(500, "Message must be less than 500 characters").optional(),
  status: PartnerRequestStatusSchema.default("pending"),
});

export type PartnerRequestType = z.infer<typeof PartnerRequestBaseSchema>;

/**
 * ✅ Partner Request with populated references (for responses)
 */
export interface IPartnerRequestPopulated {
  _id: string;
  trip: {
    _id: string;
    destination: string;
    startDate: Date;
    endDate: Date;
    budget: number;
    travelType: string;
  };
  sender: {
    _id: string;
    fullName: string;
    email: string;
    profileImagePath?: string;
  };
  receiver: {
    _id: string;
    fullName: string;
    email: string;
    profileImagePath?: string;
  };
  message?: string;
  status: PartnerRequestStatus;
  createdAt: Date;
  updatedAt: Date;
}
