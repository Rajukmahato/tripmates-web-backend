import { z } from "zod";
import { UserBaseSchema, UserSchema } from "../types/user.type";

export const CreateUserDto = UserBaseSchema.pick({
  fullName: true,
  email: true,
  phoneNumber: true,
  password: true,
  confirmPassword: true,
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Password does not match",
    path: ["confirmPassword"],
  }
);

export type CreateUserDto = z.infer<typeof CreateUserDto>;

export const LoginUserDto = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string(),
});

export type LoginUserDto = z.infer<typeof LoginUserDto>;

export const UpdateUserDto = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 letters long").optional(),
  phoneNumber: z
    .string()
    .regex(/^[0-9]{10}$/, "Phone number must be exactly 10 digits (0-9)")
    .optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  profileImagePath: z.string().optional(),
  travelInterests: z.array(z.string()).optional(),
  budgetRange: z.object({
    min: z.number().min(0, "Minimum budget must be 0 or greater"),
    max: z.number().min(0, "Maximum budget must be 0 or greater"),
  }).optional(),
});

export type UpdateUserDto = z.infer<typeof UpdateUserDto>;

export const ForgotPasswordDto = z.object({
  email: z.string().email("Invalid email address"),
  platform: z.enum(["android", "ios", "web"]).optional().default("web"),
});

export type ForgotPasswordDto = z.infer<typeof ForgotPasswordDto>;

export const ResetPasswordDto = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  }
);

export type ResetPasswordDto = z.infer<typeof ResetPasswordDto>;

export const VerifyOTPDto = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().length(6, "OTP must be exactly 6 digits"),
});

export type VerifyOTPDto = z.infer<typeof VerifyOTPDto>;

export const ResetPasswordWithOTPDto = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().length(6, "OTP must be exactly 6 digits"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  }
);

export type ResetPasswordWithOTPDto = z.infer<typeof ResetPasswordWithOTPDto>;

// ===== ADMIN DTOs =====

export const AdminCreateUserDto = UserBaseSchema.pick({
  fullName: true,
  email: true,
  phoneNumber: true,
  password: true,
  bio: true,
  location: true,
  profileImagePath: true,
});

export type AdminCreateUserDto = z.infer<typeof AdminCreateUserDto>;

export const AdminUpdateUserDto = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 letters long").optional(),
  email: z.string().email("Invalid email address").optional(),
  phoneNumber: z
    .string()
    .regex(/^[0-9]{10}$/, "Phone number must be exactly 10 digits (0-9)")
    .optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  profileImagePath: z.string().optional(),
  travelInterests: z.array(z.string()).optional(),
  budgetRange: z.object({
    min: z.number().min(0, "Minimum budget must be 0 or greater"),
    max: z.number().min(0, "Maximum budget must be 0 or greater"),
  }).optional(),
  role: z.enum(["user", "admin"]).optional(),
});

export type AdminUpdateUserDto = z.infer<typeof AdminUpdateUserDto>;
