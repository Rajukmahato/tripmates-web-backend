import { z } from "zod";

export const StartLocationSharingDto = z.object({
    tripId: z.string().min(1, "Trip ID is required"),
    latitude: z.number().min(-90).max(90, "Invalid latitude"),
    longitude: z.number().min(-180).max(180, "Invalid longitude"),
});

export type StartLocationSharingDto = z.infer<typeof StartLocationSharingDto>;

export const UpdateLocationDto = z.object({
    tripId: z.string().min(1, "Trip ID is required"),
    latitude: z.number().min(-90).max(90, "Invalid latitude"),
    longitude: z.number().min(-180).max(180, "Invalid longitude"),
});

export type UpdateLocationDto = z.infer<typeof UpdateLocationDto>;

export const NearbyPlacesQueryDto = z.object({
    latitude: z.string().transform(v => parseFloat(v)),
    longitude: z.string().transform(v => parseFloat(v)),
    radius: z.string().transform(v => parseInt(v)).optional(),
    type: z.string().optional(),
});

export type NearbyPlacesQueryDto = z.infer<typeof NearbyPlacesQueryDto>;

export const RouteQueryDto = z.object({
    originLat: z.string().transform(v => parseFloat(v)),
    originLng: z.string().transform(v => parseFloat(v)),
    destLat: z.string().transform(v => parseFloat(v)),
    destLng: z.string().transform(v => parseFloat(v)),
});

export type RouteQueryDto = z.infer<typeof RouteQueryDto>;
