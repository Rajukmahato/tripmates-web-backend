import { Router } from "express";
import { AdminController } from "../controllers/admin.controller";
import { authorizedMiddleware } from "../middlewares/auth.middleware";
import { adminMiddleware } from "../middlewares/admin.middleware";
import { uploadProfileImage } from "../middlewares/upload.middleware";

const adminController = new AdminController();
const router = Router();

// Apply authorization and admin middleware to all routes
router.use(authorizedMiddleware);
router.use(adminMiddleware);

// CRUD routes
router.post("/users", uploadProfileImage.single("profileImage"), adminController.createUser);
router.get("/users", adminController.getAllUsers);
router.get("/users/:id", adminController.getUserById);
router.put("/users/:id", uploadProfileImage.single("profileImage"), adminController.updateUser);
router.delete("/users/:id", adminController.deleteUser);

export default router;
