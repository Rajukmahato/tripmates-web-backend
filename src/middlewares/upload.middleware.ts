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
        // Get user ID from request
        const userId = req.user?._id?.toString() || "unknown";
        const fileExtension = path.extname(file.originalname);
        const fileName = `${userId}-profile${fileExtension}`;
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
