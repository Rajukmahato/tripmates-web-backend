import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { uploadProfileImage } from "../middlewares/upload.middleware";

const userController = new UserController();
const router = Router();

router.get("/profile/:userId", userController.getProfile);
router.put(
	"/profile/:userId",
	uploadProfileImage.single("profileImage"),
	userController.updateProfile
);

export default router;
