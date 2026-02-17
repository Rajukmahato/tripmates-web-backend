import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authorizedMiddleware } from "../middlewares/auth.middleware";
import { uploadProfileImage } from "../middlewares/upload.middleware";
import { passwordResetLimiter } from "../middlewares/rate-limit.middleware";

const authController = new AuthController();

const router = Router();

// Auth endpoints with rate limiting applied at app.ts level
router.post("/login", authController.loginUser);
router.post("/register", authController.createUser);
router.post("/forgot-password", passwordResetLimiter, authController.forgotPassword);
router.post("/reset-password", passwordResetLimiter, authController.resetPassword);
router.put("/:id", authorizedMiddleware, uploadProfileImage.single("profileImage"), authController.updateUserProfile);

export default router;




