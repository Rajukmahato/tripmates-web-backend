import { Router } from "express";
import { AdminController } from "../controllers/admin.controller";
import { AdminTripController } from "../controllers/adminTrip.controller";
import { authorizedMiddleware } from "../middlewares/auth.middleware";
import { adminMiddleware } from "../middlewares/admin.middleware";
import { uploadProfileImage } from "../middlewares/upload.middleware";

const adminController = new AdminController();
const adminTripController = new AdminTripController();
const router = Router();

// Apply authorization and admin middleware to all routes
router.use(authorizedMiddleware);
router.use(adminMiddleware);

// User CRUD routes
router.post("/users", uploadProfileImage.single("profileImage"), adminController.createUser);
router.get("/users", adminController.getAllUsers);
router.get("/users/stats", (req, res) => adminController.getUserStats(req, res));
router.get("/users/:id", adminController.getUserById);
router.put("/users/:id", uploadProfileImage.single("profileImage"), adminController.updateUser);
router.delete("/users/:id", adminController.deleteUser);

// Trip management routes
router.get("/trips", adminTripController.getAllTrips);
router.get("/trips/stats", (req, res) => adminTripController.getTripStats(req, res));
router.put("/trips/:id", adminTripController.updateTrip);
router.delete("/trips/:id", adminTripController.deleteTrip);

// ===== ANALYTICS ROUTES =====
router.get("/analytics/overview", (req, res) => adminController.getAnalyticsOverview(req, res));
router.get("/analytics/users", (req, res) => adminController.getUsersAnalytics(req, res));
router.get("/analytics/trips", (req, res) => adminController.getTripsAnalytics(req, res));
router.get("/analytics/matches", (req, res) => adminController.getMatchesAnalytics(req, res));
router.get("/analytics/performance", (req, res) => adminController.getPerformanceAnalytics(req, res));

export default router;
