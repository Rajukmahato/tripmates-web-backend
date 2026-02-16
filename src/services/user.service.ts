import { UserRepository } from "../repositories/user.repository";
import { CreateUserDto, LoginUserDto, AdminCreateUserDto, AdminUpdateUserDto, ForgotPasswordDto, ResetPasswordDto } from "../dots/user.dto";
import bcryptjs from "bcryptjs";
import { HttpError } from "../errors/http-error";
import { JWT_SECRET } from "../configs";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { EmailService } from "./email.service";


let userRepository = new UserRepository();
let emailService = new EmailService();

export class UserService {
    async registerUser(userData: CreateUserDto) {
        const checkEmail = await userRepository.getUserByEmail(userData.email);
        if (checkEmail) {
            throw new HttpError(409, "Email already in use");
        }
        const checkPhoneNumber = await userRepository.getUserByPhoneNumber(userData.phoneNumber);
        if (checkPhoneNumber) {
            throw new HttpError(409, "Phone Number already in use");
        }
        const hashedPassword = await bcryptjs.hash(userData.password, 10);
        userData.password = hashedPassword;
        const newUser = await userRepository.createUser(userData);
        return newUser;
    }

    async loginUser(loginData: LoginUserDto) {
        const user = await userRepository.getUserByEmail(loginData.email);
        if (!user) {
            throw new HttpError(404, "User not found!");
        }
        const validPassword = await bcryptjs.compare(loginData.password, user.password);
        if (!validPassword) {
            throw new HttpError(401, "Invalid credentials");
        }

        const payload = {
            id: user._id,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role
        }

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
        return { token, user }
    }

    async getUserProfile(userId: string) {
        const user = await userRepository.getUserById(userId);
        if (!user) {
            throw new HttpError(404, "User not found");
        }
        // Remove password from response
        const { password, ...userWithoutPassword } = user.toObject();
        return userWithoutPassword;
    }

    async updateUserProfile(userId: string, updateData: { fullName?: string; phoneNumber?: string; bio?: string; location?: string; profileImagePath?: string }) {
        // Get current user to check for old profile image
        const currentUser = await userRepository.getUserById(userId);
        if (!currentUser) {
            throw new HttpError(404, "User not found");
        }

        // Check if phone number is being updated and if it's already in use
        if (updateData.phoneNumber) {
            const existingUser = await userRepository.getUserByPhoneNumber(updateData.phoneNumber);
            if (existingUser && existingUser._id.toString() !== userId) {
                throw new HttpError(409, "Phone number already in use");
            }
        }

        // If new image is being uploaded, delete old image if it exists
        if (updateData.profileImagePath && currentUser.profileImagePath) {
            const oldImagePath = path.join(__dirname, "../../uploads", currentUser.profileImagePath.replace(/^\/uploads\//, ""));
            if (fs.existsSync(oldImagePath)) {
                try {
                    fs.unlinkSync(oldImagePath);
                } catch (err) {
                    console.error("Error deleting old profile image:", err);
                }
            }
        }

        const updatedUser = await userRepository.updateUser(userId, updateData);
        if (!updatedUser) {
            throw new HttpError(404, "User not found");
        }
        return updatedUser;
    }

    // ===== PASSWORD RESET METHODS =====

    async forgotPassword(forgotPasswordData: ForgotPasswordDto) {
        const user = await userRepository.getUserByEmail(forgotPasswordData.email);
        if (!user) {
            // Don't reveal that the user doesn't exist for security
            return { message: "If that email exists, a reset link has been sent" };
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        // Save hashed token and expiry (1 hour from now)
        await userRepository.updateUser(user._id.toString(), {
            resetPasswordToken: hashedToken,
            resetPasswordExpires: new Date(Date.now() + 3600000) // 1 hour
        });

        // Send email
        try {
            await emailService.sendPasswordResetEmail(
                user.email,
                resetToken,
                user.fullName || 'User'
            );
        } catch (error) {
            // Clear the reset token if email fails
            await userRepository.updateUser(user._id.toString(), {
                resetPasswordToken: undefined,
                resetPasswordExpires: undefined
            });
            throw new HttpError(500, "Failed to send reset email. Please try again.");
        }

        return { message: "If that email exists, a reset link has been sent" };
    }

    async resetPassword(resetPasswordData: ResetPasswordDto) {
        // Hash the token from the request
        const hashedToken = crypto
            .createHash('sha256')
            .update(resetPasswordData.token)
            .digest('hex');

        // Find user with valid token
        const user = await userRepository.getUserByResetToken(hashedToken);
        if (!user) {
            throw new HttpError(400, "Invalid or expired reset token");
        }

        // Hash new password
        const hashedPassword = await bcryptjs.hash(resetPasswordData.password, 10);

        // Update password and clear reset token
        await userRepository.updateUser(user._id.toString(), {
            password: hashedPassword,
            resetPasswordToken: undefined,
            resetPasswordExpires: undefined
        });

        // Send confirmation email
        try {
            await emailService.sendPasswordResetConfirmation(
                user.email,
                user.fullName || 'User'
            );
        } catch (error) {
            console.error('Error sending confirmation email:', error);
            // Don't throw error here, password was already reset successfully
        }

        return { message: "Password reset successful" };
    }

    // ===== ADMIN METHODS =====

    async createUserAsAdmin(userData: AdminCreateUserDto) {
        const checkEmail = await userRepository.getUserByEmail(userData.email);
        if (checkEmail) {
            throw new HttpError(409, "Email already in use");
        }
        const checkPhoneNumber = await userRepository.getUserByPhoneNumber(userData.phoneNumber);
        if (checkPhoneNumber) {
            throw new HttpError(409, "Phone Number already in use");
        }
        
        const hashedPassword = await bcryptjs.hash(userData.password, 10);
        const adminUserData = {
            ...userData,
            password: hashedPassword,
            role: "user" // Default to user role, admin can update if needed
        };
        
        const newUser = await userRepository.createUser(adminUserData);
        return newUser;
    }

    async getAllUsers(page: number = 1, limit: number = 10) {
        const users = await userRepository.getAllUsers(page, limit);
        const totalCount = await userRepository.getUsersCount();
        const totalPages = Math.ceil(totalCount / limit);

        return {
            users,
            pagination: {
                currentPage: page,
                totalPages,
                totalCount,
                limit
            }
        };
    }

    async getUserByIdAsAdmin(userId: string) {
        const user = await userRepository.getUserById(userId);
        if (!user) {
            throw new HttpError(404, "User not found");
        }
        const { password, ...userWithoutPassword } = user.toObject();
        return userWithoutPassword;
    }

    async updateUserAsAdmin(userId: string, updateData: AdminUpdateUserDto) {
        const currentUser = await userRepository.getUserById(userId);
        if (!currentUser) {
            throw new HttpError(404, "User not found");
        }

        // Check if email is being updated and if it's already in use
        if (updateData.email) {
            const existingUser = await userRepository.getUserByEmail(updateData.email);
            if (existingUser && existingUser._id.toString() !== userId) {
                throw new HttpError(409, "Email already in use");
            }
        }

        // Check if phone number is being updated and if it's already in use
        if (updateData.phoneNumber) {
            const existingUser = await userRepository.getUserByPhoneNumber(updateData.phoneNumber);
            if (existingUser && existingUser._id.toString() !== userId) {
                throw new HttpError(409, "Phone number already in use");
            }
        }

        // If new image is being uploaded, delete old image if it exists
        if (updateData.profileImagePath && currentUser.profileImagePath) {
            const oldImagePath = path.join(__dirname, "../../uploads", currentUser.profileImagePath.replace(/^\/uploads\//, ""));
            if (fs.existsSync(oldImagePath)) {
                try {
                    fs.unlinkSync(oldImagePath);
                } catch (err) {
                    console.error("Error deleting old profile image:", err);
                }
            }
        }

        const updatedUser = await userRepository.updateUser(userId, updateData);
        if (!updatedUser) {
            throw new HttpError(404, "User not found");
        }
        return updatedUser;
    }

    async deleteUserAsAdmin(userId: string) {
        const user = await userRepository.getUserById(userId);
        if (!user) {
            throw new HttpError(404, "User not found");
        }

        // Delete profile image if exists
        if (user.profileImagePath) {
            const imagePath = path.join(__dirname, "../../uploads", user.profileImagePath.replace(/^\/uploads\//, ""));
            if (fs.existsSync(imagePath)) {
                try {
                    fs.unlinkSync(imagePath);
                } catch (err) {
                    console.error("Error deleting profile image:", err);
                }
            }
        }

        const deleted = await userRepository.deleteUser(userId);
        if (!deleted) {
            throw new HttpError(500, "Failed to delete user");
        }
        return { message: "User deleted successfully" };
    }
    
}