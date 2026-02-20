import mongoose from "mongoose";
import { HttpError } from "../errors/http-error";
import { destinationRepository } from "../repositories/destination.repository";
import {
    CreateDestinationDto,
    UpdateDestinationDto,
    UpdateDestinationStatusDto,
} from "../dots/destination.dto";
import { IDestination } from "../modules/destination.model";

export class DestinationService {
    async createDestination(payload: CreateDestinationDto): Promise<IDestination> {
        try {
            return await destinationRepository.create(payload);
        } catch (error: any) {
            if (error?.code === 11000) {
                throw new HttpError(409, "Destination with same name and country already exists");
            }
            throw error;
        }
    }

    async getAllDestinations(
        page: number = 1,
        limit: number = 20,
        includeInactive: boolean = false
    ): Promise<{
        destinations: IDestination[];
        total: number;
        pages: number;
        currentPage: number;
    }> {
        const result = await destinationRepository.findAll(page, limit, includeInactive);
        return {
            ...result,
            currentPage: page,
        };
    }

    async getDestinationById(destinationId: string, includeInactive: boolean = false): Promise<IDestination> {
        if (!mongoose.Types.ObjectId.isValid(destinationId)) {
            throw new HttpError(400, "Invalid destination ID");
        }

        const destination = await destinationRepository.findById(destinationId, includeInactive);
        if (!destination) {
            throw new HttpError(404, "Destination not found");
        }

        return destination;
    }

    async searchDestinations(
        searchTerm: string,
        page: number = 1,
        limit: number = 20,
        includeInactive: boolean = false
    ): Promise<{
        destinations: IDestination[];
        total: number;
        pages: number;
        currentPage: number;
    }> {
        const trimmedTerm = searchTerm?.trim();
        if (!trimmedTerm) {
            throw new HttpError(400, "Search query is required");
        }

        const result = await destinationRepository.search(trimmedTerm, page, limit, includeInactive);
        return {
            ...result,
            currentPage: page,
        };
    }

    async updateDestination(destinationId: string, payload: UpdateDestinationDto): Promise<IDestination> {
        if (!mongoose.Types.ObjectId.isValid(destinationId)) {
            throw new HttpError(400, "Invalid destination ID");
        }

        try {
            const updatedDestination = await destinationRepository.update(destinationId, payload);
            if (!updatedDestination) {
                throw new HttpError(404, "Destination not found");
            }
            return updatedDestination;
        } catch (error: any) {
            if (error?.code === 11000) {
                throw new HttpError(409, "Destination with same name and country already exists");
            }
            throw error;
        }
    }

    async updateDestinationStatus(
        destinationId: string,
        payload: UpdateDestinationStatusDto
    ): Promise<IDestination> {
        if (!mongoose.Types.ObjectId.isValid(destinationId)) {
            throw new HttpError(400, "Invalid destination ID");
        }

        const updatedDestination = await destinationRepository.updateStatus(destinationId, payload.isActive);
        if (!updatedDestination) {
            throw new HttpError(404, "Destination not found");
        }

        return updatedDestination;
    }

    async deleteDestination(destinationId: string): Promise<{ message: string }> {
        if (!mongoose.Types.ObjectId.isValid(destinationId)) {
            throw new HttpError(400, "Invalid destination ID");
        }

        const deleted = await destinationRepository.delete(destinationId);
        if (!deleted) {
            throw new HttpError(404, "Destination not found");
        }

        return { message: "Destination deleted successfully" };
    }

    async getDestinationStats(): Promise<{
        totalDestinations: number;
        activeDestinations: number;
        inactiveDestinations: number;
        uniqueCountries: number;
    }> {
        return await destinationRepository.getStats();
    }
}

export const destinationService = new DestinationService();
