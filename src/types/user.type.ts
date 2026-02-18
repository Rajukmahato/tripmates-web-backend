import { z } from "zod";

/**
 * ✅ Base schema (NO refine here)
 * Used for DTOs like login, register, update, etc.
 */
export const UserBaseSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 letters long").default(""),
  email: z.string().email("Invalid email address"),
  phoneNumber: z
    .string()
    .regex(/^[0-9]{10}$/, "Phone number must be exactly 10 digits (0-9)"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
  bio: z.string().default(""),
  location: z.string().default(""),
  profileImagePath: z.string().default(""),
  travelInterests: z.array(z.string()).default([]),
  budgetRange: z.object({
    min: z.number().min(0, "Minimum budget must be 0 or greater").default(0),
    max: z.number().min(0, "Maximum budget must be 0 or greater").default(0),
  }).default({ min: 0, max: 0 }),
});

/**
 * ✅ Full schema (with refinement)
 * Used ONLY where full validation is needed (e.g. register)
 */
export const UserSchema = UserBaseSchema.refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Password does not match",
    path: ["confirmPassword"],
  }
);

export type UserType = z.infer<typeof UserSchema>;
