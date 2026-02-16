import { UserModel, IUser } from "../modules/user.model";

export interface IUserRepository {
    createUser(userData: Partial<IUser>): Promise<IUser>;
    getUserByPhoneNumber(phoneNumber: string): Promise<IUser | null>;
    getUserByEmail(email: string): Promise<IUser | null>;
    getUserById(userId: string): Promise<IUser | null>;
    updateUser(userId: string, userData: Partial<IUser>): Promise<IUser | null>;
    getAllUsers(page?: number, limit?: number): Promise<IUser[]>;
    deleteUser(userId: string): Promise<boolean>;
    getUsersCount(): Promise<number>;
    getUserByResetToken(token: string): Promise<IUser | null>;
}

export class UserRepository implements IUserRepository {

    async getUserById(userId: string): Promise<IUser | null> {
        const user = await UserModel.findById(userId);
        return user;
    }

    async getUserByPhoneNumber(phoneNumber: string): Promise<IUser | null> {
        const user = await UserModel.findOne({ "phoneNumber": phoneNumber });
        return user;
    }

    async getUserByEmail(email: string): Promise<IUser | null> {
        const user = await UserModel.findOne({ "email": email });
        return user;
    }

    async createUser(userData: Partial<IUser>): Promise<IUser> {
        const user = new UserModel(userData);
        return await user.save();
    }

    async updateUser(userId: string, userData: Partial<IUser>): Promise<IUser | null> {
        const user = await UserModel.findByIdAndUpdate(
            userId,
            { $set: userData },
            { new: true, runValidators: true }
        ).select('-password');
        return user;
    }

    async getAllUsers(page: number = 1, limit: number = 10): Promise<IUser[]> {
        const skip = (page - 1) * limit;
        const users = await UserModel.find()
            .select('-password')
            .limit(limit)
            .skip(skip)
            .sort({ createdAt: -1 });
        return users;
    }

    async getUsersCount(): Promise<number> {
        return await UserModel.countDocuments();
    }

    async deleteUser(userId: string): Promise<boolean> {
        const result = await UserModel.findByIdAndDelete(userId);
        return result ? true : false;
    }

    async getUserByResetToken(token: string): Promise<IUser | null> {
        const user = await UserModel.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });
        return user;
    }
}