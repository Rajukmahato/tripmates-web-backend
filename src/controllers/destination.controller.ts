import { Request, Response } from "express";
import z from "zod";
import {
    CreateDestinationDto,
    UpdateDestinationDto,
    UpdateDestinationStatusDto,
} from "../dots/destination.dto";
import { destinationService } from "../services/destination.service";
import {
    deleteDestinationImageFileByPath,
    getDestinationImageFilePath,
} from "../middlewares/upload.middleware";

const parseBoolean = (value: any): boolean => value === "true" || value === true;

const parseStringArrayField = (value: unknown): string[] | undefined => {
    if (value === undefined || value === null || value === "") {
        return undefined;
    }

    if (Array.isArray(value)) {
        return value
            .map((item) => String(item).trim())
            .filter((item) => item.length > 0);
    }

    if (typeof value === "string") {
        const trimmedValue = value.trim();
        if (!trimmedValue) {
            return undefined;
        }

        try {
            const parsed = JSON.parse(trimmedValue);
            if (Array.isArray(parsed)) {
                return parsed
                    .map((item) => String(item).trim())
                    .filter((item) => item.length > 0);
            }
        } catch (error) {
            return trimmedValue
                .split(",")
                .map((item) => item.trim())
                .filter((item) => item.length > 0);
        }
    }

    return undefined;
};

export class DestinationController {
    async createDestination(req: Request, res: Response) {
        try {
            const normalizedPayload = {
                ...req.body,
                coverImage: req.file?.filename
                    ? getDestinationImageFilePath(req.file.filename)
                    : req.body.coverImage,
                attractions: parseStringArrayField(req.body.attractions),
                travelTips: parseStringArrayField(req.body.travelTips),
            };

            const parsedData = CreateDestinationDto.safeParse(normalizedPayload);
            if (!parsedData.success) {
                return res.status(400).json({
                    success: false,
                    message: z.prettifyError(parsedData.error),
                });
            }

            const destination = await destinationService.createDestination(parsedData.data);

            return res.status(201).json({
                success: true,
                message: "Destination created successfully",
                data: destination,
            });
        } catch (error: Error | any) {
            return res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || "Internal Server Error",
            });
        }
    }

    async getAllDestinations(req: Request, res: Response) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const includeInactive = parseBoolean(req.query.includeInactive);

            const result = await destinationService.getAllDestinations(page, limit, includeInactive);

            return res.status(200).json({
                success: true,
                message: "Destinations retrieved successfully",
                data: result.destinations,
                pagination: {
                    currentPage: result.currentPage,
                    totalPages: result.pages,
                    totalCount: result.total,
                    limit,
                },
            });
        } catch (error: Error | any) {
            return res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || "Internal Server Error",
            });
        }
    }

    async searchDestinations(req: Request, res: Response) {
        try {
            const searchTerm = (req.query.q as string) || (req.query.search as string) || "";
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const includeInactive = parseBoolean(req.query.includeInactive);

            const result = await destinationService.searchDestinations(
                searchTerm,
                page,
                limit,
                includeInactive
            );

            return res.status(200).json({
                success: true,
                message: "Destinations retrieved successfully",
                data: result.destinations,
                pagination: {
                    currentPage: result.currentPage,
                    totalPages: result.pages,
                    totalCount: result.total,
                    limit,
                },
            });
        } catch (error: Error | any) {
            return res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || "Internal Server Error",
            });
        }
    }

    async getDestinationById(req: Request, res: Response) {
        try {
            const destinationId = req.params.id;
            const includeInactive = parseBoolean(req.query.includeInactive);

            const destination = await destinationService.getDestinationById(destinationId, includeInactive);

            return res.status(200).json({
                success: true,
                message: "Destination retrieved successfully",
                data: destination,
            });
        } catch (error: Error | any) {
            return res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || "Internal Server Error",
            });
        }
    }

    async updateDestination(req: Request, res: Response) {
        try {
            const destinationId = req.params.id;
            const existingDestination = await destinationService.getDestinationById(destinationId, true);

            const hasUploadedFile = Boolean(req.file?.filename);
            const hasCoverImageInBody = typeof req.body.coverImage === "string";

            const normalizedPayload = {
                ...req.body,
                coverImage: hasUploadedFile
                    ? getDestinationImageFilePath(req.file!.filename)
                    : hasCoverImageInBody
                        ? req.body.coverImage
                        : undefined,
                attractions: parseStringArrayField(req.body.attractions),
                travelTips: parseStringArrayField(req.body.travelTips),
            };

            const parsedData = UpdateDestinationDto.safeParse(normalizedPayload);

            if (!parsedData.success) {
                return res.status(400).json({
                    success: false,
                    message: z.prettifyError(parsedData.error),
                });
            }

            const destination = await destinationService.updateDestination(destinationId, parsedData.data);

            if (
                (hasUploadedFile || hasCoverImageInBody) &&
                existingDestination.coverImage &&
                existingDestination.coverImage !== destination.coverImage
            ) {
                deleteDestinationImageFileByPath(existingDestination.coverImage);
            }

            return res.status(200).json({
                success: true,
                message: "Destination updated successfully",
                data: destination,
            });
        } catch (error: Error | any) {
            return res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || "Internal Server Error",
            });
        }
    }

    async updateDestinationStatus(req: Request, res: Response) {
        try {
            const destinationId = req.params.id;
            const parsedData = UpdateDestinationStatusDto.safeParse(req.body);

            if (!parsedData.success) {
                return res.status(400).json({
                    success: false,
                    message: z.prettifyError(parsedData.error),
                });
            }

            const destination = await destinationService.updateDestinationStatus(destinationId, parsedData.data);

            return res.status(200).json({
                success: true,
                message: "Destination status updated successfully",
                data: destination,
            });
        } catch (error: Error | any) {
            return res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || "Internal Server Error",
            });
        }
    }

    async deleteDestination(req: Request, res: Response) {
        try {
            const destinationId = req.params.id;
            const result = await destinationService.deleteDestination(destinationId);

            return res.status(200).json({
                success: true,
                message: result.message,
            });
        } catch (error: Error | any) {
            return res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || "Internal Server Error",
            });
        }
    }

    async getDestinationStats(req: Request, res: Response) {
        try {
            const stats = await destinationService.getDestinationStats();

            return res.status(200).json({
                success: true,
                message: "Destination stats retrieved successfully",
                data: stats,
            });
        } catch (error: Error | any) {
            return res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || "Internal Server Error",
            });
        }
    }
}

export const destinationController = new DestinationController();
