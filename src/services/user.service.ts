import { UserRepository } from "../repositories/user.repository";
import { CreateUserDto, LoginUserDto } from "../dots/user.dto";
import bcryptjs from "bcryptjs";
import { HttpError } from "../errors/http-error";
import { JWT_SECRET } from "../configs";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";


let userRepository = new UserRepository();

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
    
}