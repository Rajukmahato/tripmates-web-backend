import { Request, Response } from "express";
import { UserService } from "../services/user.service";
import { UpdateUserDto } from "../dots/user.dto";
import { renameUploadedFile } from "../middlewares/upload.middleware";
import z from "zod";

const userService = new UserService();

export class UserController {
    async getProfile(req: Request, res: Response) {
        try {
            const userId =
                req.user?._id?.toString() ||
                (typeof req.params.userId === "string" ? req.params.userId : undefined) ||
                (typeof req.query.userId === "string" ? req.query.userId : undefined) ||
                (req.body && req.body.userId ? String(req.body.userId) : undefined);

            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: "userId is required"
                });
            }

            const user = await userService.getUserProfile(userId);
            return res.status(200).json({
                success: true,
                message: "Profile retrieved successfully",
                data: user
            });
        } catch (error: Error | any) {
            return res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || "Internal Server Error"
            });
        }
    }

    async updateProfile(req: Request, res: Response) {
        try {
            const userId =
                req.user?._id?.toString() ||
                (typeof req.params.userId === "string" ? req.params.userId : undefined) ||
                (typeof req.query.userId === "string" ? req.query.userId : undefined) ||
                (req.body && req.body.userId ? String(req.body.userId) : undefined);

            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: "userId is required"
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
}
