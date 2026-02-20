import mongoose from "mongoose";
import { DestinationModel, IDestination } from "../modules/destination.model";

export class DestinationRepository {
    async create(destinationData: Partial<IDestination>): Promise<IDestination> {
        const destination = new DestinationModel(destinationData);
        return await destination.save();
    }

    async findAll(
        page: number = 1,
        limit: number = 20,
        includeInactive: boolean = false
    ): Promise<{ destinations: IDestination[]; total: number; pages: number }> {
        const skip = (page - 1) * limit;
        const query = includeInactive ? {} : { isActive: true };

        const [destinations, total] = await Promise.all([
            DestinationModel.find(query)
                .sort({ name: 1 })
                .skip(skip)
                .limit(limit),
            DestinationModel.countDocuments(query),
        ]);

        return {
            destinations,
            total,
            pages: Math.ceil(total / limit),
        };
    }

    async findById(destinationId: string, includeInactive: boolean = false): Promise<IDestination | null> {
        if (!mongoose.Types.ObjectId.isValid(destinationId)) {
            return null;
        }

        const query: any = { _id: destinationId };
        if (!includeInactive) {
            query.isActive = true;
        }

        return await DestinationModel.findOne(query);
    }

    async search(
        searchTerm: string,
        page: number = 1,
        limit: number = 20,
        includeInactive: boolean = false
    ): Promise<{ destinations: IDestination[]; total: number; pages: number }> {
        const skip = (page - 1) * limit;
        const baseQuery: any = {
            $or: [
                { name: { $regex: searchTerm, $options: "i" } },
                { country: { $regex: searchTerm, $options: "i" } },
            ],
        };

        if (!includeInactive) {
            baseQuery.isActive = true;
        }

        const [destinations, total] = await Promise.all([
            DestinationModel.find(baseQuery)
                .sort({ name: 1 })
                .skip(skip)
                .limit(limit),
            DestinationModel.countDocuments(baseQuery),
        ]);

        return {
            destinations,
            total,
            pages: Math.ceil(total / limit),
        };
    }

    async update(destinationId: string, updateData: Partial<IDestination>): Promise<IDestination | null> {
        if (!mongoose.Types.ObjectId.isValid(destinationId)) {
            return null;
        }

        return await DestinationModel.findByIdAndUpdate(
            destinationId,
            { $set: updateData },
            { new: true, runValidators: true }
        );
    }

    async updateStatus(destinationId: string, isActive: boolean): Promise<IDestination | null> {
        if (!mongoose.Types.ObjectId.isValid(destinationId)) {
            return null;
        }

        return await DestinationModel.findByIdAndUpdate(
            destinationId,
            { $set: { isActive } },
            { new: true, runValidators: true }
        );
    }

    async delete(destinationId: string): Promise<boolean> {
        if (!mongoose.Types.ObjectId.isValid(destinationId)) {
            return false;
        }

        const result = await DestinationModel.findByIdAndDelete(destinationId);
        return !!result;
    }

    async getStats(): Promise<{
        totalDestinations: number;
        activeDestinations: number;
        inactiveDestinations: number;
        uniqueCountries: number;
    }> {
        const [totalDestinations, activeDestinations, uniqueCountriesResult] = await Promise.all([
            DestinationModel.countDocuments(),
            DestinationModel.countDocuments({ isActive: true }),
            DestinationModel.distinct("country"),
        ]);

        return {
            totalDestinations,
            activeDestinations,
            inactiveDestinations: totalDestinations - activeDestinations,
            uniqueCountries: uniqueCountriesResult.length,
        };
    }
}

export const destinationRepository = new DestinationRepository();
