import { Request, Response } from "express";
import { UserService } from "../services/user.service";
import { AdminCreateUserDto, AdminUpdateUserDto } from "../dots/user.dto";
import { renameUploadedFile } from "../middlewares/upload.middleware";
import z from "zod";

const userService = new UserService();

export class AdminController {
    
    async createUser(req: Request, res: Response) {
        try {
            const parsedData = AdminCreateUserDto.safeParse(req.body);
            if (!parsedData.success) {
                return res.status(400).json({
                    success: false,
                    message: z.prettifyError(parsedData.error)
                });
            }

            let userData = { ...parsedData.data };
            
            // Create user first
            const newUser = await userService.createUserAsAdmin(userData);

            // If file was uploaded, rename it with the user's ID
            if (req.file) {
                const finalFilename = renameUploadedFile(req.file.filename, newUser._id.toString());
                userData.profileImagePath = `/uploads/profiles/${finalFilename}`;
                
                // Update user with image path
                await userService.updateUserAsAdmin(newUser._id.toString(), {
                    profileImagePath: userData.profileImagePath
                });
                
                // Update response data
                newUser.profileImagePath = userData.profileImagePath;
            }

            return res.status(201).json({
                success: true,
                message: "User created successfully",
                data: newUser
            });
        } catch (error: Error | any) {
            return res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || "Internal Server Error"
            });
        }
    }

    async getAllUsers(req: Request, res: Response) {
        try {
            const pageParam = req.query.page ? parseInt(req.query.page as string) : 1;
            const limitParam = req.query.limit ? parseInt(req.query.limit as string) : 10;

            // Handle NaN values from parseInt
            const page = isNaN(pageParam) ? 1 : pageParam;
            const limit = isNaN(limitParam) ? 10 : limitParam;

            if (page < 1 || limit < 1) {
                return res.status(400).json({
                    success: false,
                    message: "Page and limit must be positive numbers"
                });
            }

            const result = await userService.getAllUsers(page, limit);
            return res.status(200).json({
                success: true,
                message: "Users retrieved successfully",
                data: result.users,
                pagination: result.pagination
            });
        } catch (error: Error | any) {
            return res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || "Internal Server Error"
            });
        }
    }

    async getUserById(req: Request, res: Response) {
        try {
            const userId = req.params.id;

            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: "User ID is required"
                });
            }

            const user = await userService.getUserByIdAsAdmin(userId);
            return res.status(200).json({
                success: true,
                message: "User retrieved successfully",
                data: user
            });
        } catch (error: Error | any) {
            return res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || "Internal Server Error"
            });
        }
    }

    async updateUser(req: Request, res: Response) {
        try {
            const userId = req.params.id;

            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: "User ID is required"
                });
            }

            const parsedData = AdminUpdateUserDto.safeParse(req.body);
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

            const updatedUser = await userService.updateUserAsAdmin(userId, updateData);
            return res.status(200).json({
                success: true,
                message: "User updated successfully",
                data: updatedUser
            });
        } catch (error: Error | any) {
            return res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || "Internal Server Error"
            });
        }
    }

    async deleteUser(req: Request, res: Response) {
        try {
            const userId = req.params.id;

            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: "User ID is required"
                });
            }

            const result = await userService.deleteUserAsAdmin(userId);
            return res.status(200).json({
                success: true,
                message: result.message,
                data: null
            });
        } catch (error: Error | any) {
            return res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || "Internal Server Error"
            });
        }
    }
}
