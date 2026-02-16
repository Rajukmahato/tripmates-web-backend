import multer, { StorageEngine } from "multer";
import path from "path";
import fs from "fs";

// Define upload directory
const uploadDir = path.join(__dirname, "../../uploads/profiles");

// Create directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage: StorageEngine = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generate unique temporary filename
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const fileExtension = path.extname(file.originalname);
        const fileName = `temp-${timestamp}-${randomString}${fileExtension}`;
        cb(null, fileName);
    }
});

// File filter - only images allowed
const fileFilter = (
    req: any,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
) => {
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only image files are allowed (jpeg, png, gif, webp)"));
    }
};

// Create multer upload instance
export const uploadProfileImage = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max file size
    }
});

// Helper function to rename uploaded file to user's ID
export const renameUploadedFile = (tempFilename: string, userId: string): string => {
    const fileExtension = path.extname(tempFilename);
    const newFilename = `${userId}-profile${fileExtension}`;
    const oldPath = path.join(uploadDir, tempFilename);
    const newPath = path.join(uploadDir, newFilename);
    
    // Delete old profile image if exists
    if (fs.existsSync(newPath)) {
        fs.unlinkSync(newPath);
    }
    
    // Rename temp file to user's profile name
    if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
    }
    
    return newFilename;
};
