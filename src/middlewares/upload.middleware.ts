/**
 * File Upload Middleware
 * Handles secure file uploads with validation
 */

import multer, { StorageEngine } from "multer";
import path from "path";
import fs from "fs";
import { HttpError } from "../errors/http-error";

// Define upload directories
const profileUploadDir = path.join(__dirname, "../../uploads/profiles");
const tripUploadDir = path.join(__dirname, "../../uploads/trips");
const destinationUploadDir = path.join(__dirname, "../../uploads/destinations");

// Create directories if they don't exist
if (!fs.existsSync(profileUploadDir)) {
    fs.mkdirSync(profileUploadDir, { recursive: true });
}
if (!fs.existsSync(tripUploadDir)) {
    fs.mkdirSync(tripUploadDir, { recursive: true });
}
if (!fs.existsSync(destinationUploadDir)) {
    fs.mkdirSync(destinationUploadDir, { recursive: true });
}

// File size limits (in bytes)
export const FILE_LIMITS = {
    PROFILE_IMAGE: 5 * 1024 * 1024, // 5MB
    DOCUMENT: 10 * 1024 * 1024, // 10MB
    VIDEO: 50 * 1024 * 1024, // 50MB
};

// Allowed MIME types
export const ALLOWED_MIME_TYPES = {
    IMAGES: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    DOCUMENTS: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    VIDEOS: ["video/mp4", "video/mpeg", "video/quicktime"],
};

// Configuration for profile image uploads
const profileStorage: StorageEngine = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, profileUploadDir);
    },
    filename: (req, file, cb) => {
        // Generate unique temporary filename to prevent conflicts
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const fileExtension = path.extname(file.originalname).toLowerCase();
        const fileName = `temp-${timestamp}-${randomString}${fileExtension}`;
        cb(null, fileName);
    }
});

/**
 * File filter for profile images
 * Validates file type and prevents path traversal
 */
const profileImageFilter = (
    req: any,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
) => {
    try {
        // Check MIME type
        if (!ALLOWED_MIME_TYPES.IMAGES.includes(file.mimetype)) {
            return cb(
                new HttpError(400, "Only image files are allowed (jpeg, png, gif, webp)")
            );
        }

        // Check file extension
        const ext = path.extname(file.originalname).toLowerCase();
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        if (!allowedExtensions.includes(ext)) {
            return cb(
                new HttpError(400, "Invalid file extension")
            );
        }

        // Prevent path traversal attacks
        const baseName = path.basename(file.originalname);
        if (baseName !== file.originalname) {
            return cb(
                new HttpError(400, "Invalid filename")
            );
        }

        cb(null, true);
    } catch (error) {
        cb(new HttpError(400, "File validation failed"));
    }
};

/**
 * Create multer upload instance for profile images
 */
export const uploadProfileImage = multer({
    storage: profileStorage,
    fileFilter: profileImageFilter,
    limits: {
        fileSize: FILE_LIMITS.PROFILE_IMAGE,
    }
});

/**
 * File filter for trip images
 * Validates file type and prevents path traversal
 */
const tripImageFilter = (
    req: any,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
) => {
    try {
        // Check MIME type
        if (!ALLOWED_MIME_TYPES.IMAGES.includes(file.mimetype)) {
            return cb(
                new HttpError(400, "Only image files are allowed (jpeg, png, gif, webp)")
            );
        }

        // Check file extension
        const ext = path.extname(file.originalname).toLowerCase();
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        if (!allowedExtensions.includes(ext)) {
            return cb(
                new HttpError(400, "Invalid file extension")
            );
        }

        // Prevent path traversal attacks
        const baseName = path.basename(file.originalname);
        if (baseName !== file.originalname) {
            return cb(
                new HttpError(400, "Invalid filename")
            );
        }

        cb(null, true);
    } catch (error) {
        cb(new HttpError(400, "File validation failed"));
    }
};

// Configuration for trip image uploads
const tripStorage: StorageEngine = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, tripUploadDir);
    },
    filename: (req, file, cb) => {
        // Generate unique temporary filename to prevent conflicts
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const fileExtension = path.extname(file.originalname).toLowerCase();
        const fileName = `trip-${timestamp}-${randomString}${fileExtension}`;
        cb(null, fileName);
    }
});

/**
 * Create multer upload instance for trip images (single)
 */
export const uploadTripImage = multer({
    storage: tripStorage,
    fileFilter: tripImageFilter,
    limits: {
        fileSize: FILE_LIMITS.PROFILE_IMAGE, // 5MB
    }
});

/**
 * Create multer upload instance for trip images (multiple)
 */
export const uploadTripImages = multer({
    storage: tripStorage,
    fileFilter: tripImageFilter,
    limits: {
        fileSize: FILE_LIMITS.PROFILE_IMAGE, // 5MB per file
    }
});

// Configuration for destination image uploads
const destinationStorage: StorageEngine = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, destinationUploadDir);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const fileExtension = path.extname(file.originalname).toLowerCase();
        const fileName = `destination-${timestamp}-${randomString}${fileExtension}`;
        cb(null, fileName);
    }
});

/**
 * Create multer upload instance for destination cover image
 */
export const uploadDestinationImage = multer({
    storage: destinationStorage,
    fileFilter: tripImageFilter,
    limits: {
        fileSize: FILE_LIMITS.PROFILE_IMAGE,
    }
});

/**
 * Helper function to rename uploaded profile file to user's ID
 * Replaces temporary filename with permanent one based on user ID
 */
export const renameUploadedFile = (tempFilename: string, userId: string): string => {
    try {
        const fileExtension = path.extname(tempFilename).toLowerCase();
        const newFilename = `${userId}-profile${fileExtension}`;
        const oldPath = path.join(profileUploadDir, tempFilename);
        const newPath = path.join(profileUploadDir, newFilename);

        // Validate paths to prevent directory traversal
        if (!oldPath.startsWith(profileUploadDir) || !newPath.startsWith(profileUploadDir)) {
            throw new Error("Invalid file path");
        }

        // Delete old profile image if exists
        if (fs.existsSync(newPath)) {
            try {
                fs.unlinkSync(newPath);
            } catch (err) {
                console.warn("Could not delete old profile image:", err);
            }
        }

        // Rename temp file to user's profile name
        if (fs.existsSync(oldPath)) {
            fs.renameSync(oldPath, newPath);
        } else {
            console.warn(`Temp file not found: ${oldPath}`);
        }

        return newFilename;
    } catch (error) {
        console.error("Error renaming uploaded file:", error);
        throw new HttpError(500, "Failed to process uploaded file");
    }
};

/**
 * Delete user's uploaded profile file
 */
export const deleteUploadedFile = (filename: string): void => {
    try {
        const filePath = path.join(profileUploadDir, filename);

        // Validate path to prevent directory traversal
        if (!filePath.startsWith(profileUploadDir)) {
            throw new Error("Invalid file path");
        }

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (error) {
        console.error("Error deleting uploaded file:", error);
    }
};

/**
 * Get file path for uploaded profile file
 */
export const getUploadedFilePath = (filename: string): string => {
    return `/uploads/profiles/${filename}`;
};

/**
 * Get trip image file path for uploaded file
 */
export const getTripImageFilePath = (filename: string): string => {
    return `/uploads/trips/${filename}`;
};

/**
 * Get destination image file path for uploaded file
 */
export const getDestinationImageFilePath = (filename: string): string => {
    return `/uploads/destinations/${filename}`;
};

/**
 * Delete destination image file by public path
 */
export const deleteDestinationImageFileByPath = (filePath: string): void => {
    try {
        if (!filePath || !filePath.startsWith("/uploads/destinations/")) {
            return;
        }

        const filename = path.basename(filePath);
        const absolutePath = path.join(destinationUploadDir, filename);

        if (!absolutePath.startsWith(destinationUploadDir)) {
            throw new Error("Invalid file path");
        }

        if (fs.existsSync(absolutePath)) {
            fs.unlinkSync(absolutePath);
        }
    } catch (error) {
        console.error("Error deleting destination uploaded file:", error);
    }
};
