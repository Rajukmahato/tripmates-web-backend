import { z } from "zod";
import { UserBaseSchema } from "../types/user.type";

export const CreateUserDto = UserBaseSchema.pick({
  fullName: true,
  phoneNumber: true,
  password: true,
  confirmPassword: true,
});

export type CreateUserDto = z.infer<typeof CreateUserDto>;

export const LoginUserDto = UserBaseSchema.pick({
  phoneNumber: true,
  password: true,
});

export type LoginUserDto = z.infer<typeof LoginUserDto>;
