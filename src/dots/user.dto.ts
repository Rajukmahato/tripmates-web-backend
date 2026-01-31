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
});

export type UpdateUserDto = z.infer<typeof UpdateUserDto>;
