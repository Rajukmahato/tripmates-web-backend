import { Request, Response } from "express";
import { UserService } from "../services/user.service";
import { CreateUserDto, LoginUserDto, UpdateUserDto, ForgotPasswordDto, ResetPasswordDto, VerifyOTPDto, ResetPasswordWithOTPDto } from "../dots/user.dto";
import { renameUploadedFile } from "../middlewares/upload.middleware";
import z, { success } from "zod";

let userService = new UserService();

export class AuthController {
    async createUser(req: Request, res: Response) {

        try {
            const parsedData = CreateUserDto.safeParse(req.body);
            if (!parsedData.success) {
                return res.status(400).json(
                    { success: false, message: z.prettifyError(parsedData.error) }
                )
            }

            const newUser = await userService.registerUser(parsedData.data);

            return res.status(201).json(
                { success: true, message: "Registered Successfully", data: newUser }
            )

        } catch (error: Error | any) {
            return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" })
        }
    }

    async loginUser(req: Request, res: Response) {
        try {
            const parsedData = LoginUserDto.safeParse(req.body);
            if (!parsedData.success) {
                return res.status(400).json(
                    { success: false, message: z.prettifyError(parsedData.error) }

                )
            }
            const { token, user } = await userService.loginUser(parsedData.data);
            return res.status(200).json(
                { success: true, message: "Login Successful", data: user, token }
            )

        } catch (error: Error | any) {
            return res.status(error.statusCode || 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            )

        }
    }

    async updateUserProfile(req: Request, res: Response) {
        try {
            const userId = req.params.id;

            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: "userId is required"
                });
            }

            // Verify the user is updating their own profile
            if (req.user?._id?.toString() !== userId) {
                return res.status(403).json({
                    success: false,
                    message: "You can only update your own profile"
                });
            }

            const parsedData = UpdateUserDto.safeParse(req.body);
            if (!parsedData.success) {
                return res.status(400).json({
                    success: false,
                    message: z.prettifyError(parsedData.error)
                });
            }

            let updateData = { ...parsedData.data };
            
            // If file was uploaded, rename it with the user's ID
            if (req.file) {
                const finalFilename = renameUploadedFile(req.file.filename, userId);
                updateData.profileImagePath = `/uploads/profiles/${finalFilename}`;
            }

            const updatedUser = await userService.updateUserProfile(userId, updateData);
            return res.status(200).json({
                success: true,
                message: "Profile updated successfully",
                data: updatedUser
            });
        } catch (error: Error | any) {
            return res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || "Internal Server Error"
            });
        }
    }

    async forgotPassword(req: Request, res: Response) {
        try {
            console.log('🔐 Forgot Password Request:', {
                email: req.body.email,
                platform: req.body.platform,
                receivedBody: req.body
            });

            const parsedData = ForgotPasswordDto.safeParse(req.body);
            if (!parsedData.success) {
                return res.status(400).json({
                    success: false,
                    message: z.prettifyError(parsedData.error)
                });
            }

            console.log('✅ Parsed Data:', {
                email: parsedData.data.email,
                platform: parsedData.data.platform
            });

            const result = await userService.forgotPassword(parsedData.data);
            return res.status(200).json({
                success: true,
                message: result.message
            });
        } catch (error: Error | any) {
            console.error('❌ Forgot password error:', {
                message: error.message,
                statusCode: error.statusCode,
                stack: error.stack
            });
            return res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || "Internal Server Error"
            });
        }
    }

    async resetPassword(req: Request, res: Response) {
        try {
            const parsedData = ResetPasswordDto.safeParse(req.body);
            if (!parsedData.success) {
                return res.status(400).json({
                    success: false,
                    message: z.prettifyError(parsedData.error)
                });
            }

            const result = await userService.resetPassword(parsedData.data);
            return res.status(200).json({
                success: true,
                message: result.message
            });
        } catch (error: Error | any) {
            return res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || "Internal Server Error"
            });
        }
    }

    async verifyOTP(req: Request, res: Response) {
        try {
            console.log('🔐 Verify OTP Request:', req.body);

            const parsedData = VerifyOTPDto.safeParse(req.body);
            if (!parsedData.success) {
                return res.status(400).json({
                    success: false,
                    message: z.prettifyError(parsedData.error)
                });
            }

            const result = await userService.verifyOTP(parsedData.data);
            return res.status(200).json({
                success: true,
                message: result.message,
                verified: result.verified
            });
        } catch (error: Error | any) {
            console.error('❌ Verify OTP error:', error.message);
            return res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || "Internal Server Error"
            });
        }
    }

    async resetPasswordWithOTP(req: Request, res: Response) {
        try {
            console.log('🔐 Reset Password with OTP Request');

            const parsedData = ResetPasswordWithOTPDto.safeParse(req.body);
            if (!parsedData.success) {
                return res.status(400).json({
                    success: false,
                    message: z.prettifyError(parsedData.error)
                });
            }

            const result = await userService.resetPasswordWithOTP(parsedData.data);
            return res.status(200).json({
                success: true,
                message: result.message
            });
        } catch (error: Error | any) {
            console.error('❌ Reset password with OTP error:', error.message);
            return res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || "Internal Server Error"
            });
        }
    }

}