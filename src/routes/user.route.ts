import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { authorizedMiddleware } from "../middlewares/auth.middleware";
import { uploadProfileImage } from "../middlewares/upload.middleware";

const userController = new UserController();
const router = Router();

router.get("/profile/:userId", userController.getProfile);
router.get("/all", authorizedMiddleware, userController.getAllUsers);
router.put(
	"/profile/:userId",
	uploadProfileImage.single("profileImage"),
	userController.updateProfile
);

export default router;
