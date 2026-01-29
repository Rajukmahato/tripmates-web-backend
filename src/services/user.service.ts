import { UserRepository } from "../repositories/user.repository";
import { CreateUserDto, LoginUserDto } from "../dots/user.dto";
import bcryptjs from "bcryptjs";
import { HttpError } from "../errors/http-error";
import { JWT_SECRET } from "../configs";
import jwt from "jsonwebtoken";


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
    
}