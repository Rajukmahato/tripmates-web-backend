import { z } from "zod";
import { UserBaseSchema, UserSchema } from "../types/user.type";

export const CreateUserDto = UserBaseSchema.pick({
  fullName: true,
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

export const LoginUserDto = UserBaseSchema.pick({
  phoneNumber: true,
  password: true,
});

export type LoginUserDto = z.infer<typeof LoginUserDto>;
