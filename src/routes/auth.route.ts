import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authorizedMiddleware } from "../middlewares/auth.middleware";
import { uploadProfileImage } from "../middlewares/upload.middleware";


const authController = new AuthController();

const router = Router();

router.post("/login", authController.loginUser);
router.post("/register", authController.createUser);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.put("/:id", authorizedMiddleware, uploadProfileImage.single("profileImage"), authController.updateUserProfile);

export default router;




