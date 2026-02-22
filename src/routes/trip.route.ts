import { Router } from "express";
import { TripController } from "../controllers/trip.controller";
import { authorizedMiddleware } from "../middlewares/auth.middleware";
import { uploadTripImage, uploadTripImages } from "../middlewares/upload.middleware";

const tripController = new TripController();
const router = Router();

// Public routes
router.get("/", tripController.getAllTrips);
router.get("/search", tripController.searchTrips);
router.get("/user/:userId", tripController.getTripsByCreator);
router.get("/:id", tripController.getTripById);

// Protected routes (require authentication)
router.post("/", authorizedMiddleware, uploadTripImages.array("images", 5), tripController.createTrip);
router.put("/:id", authorizedMiddleware, uploadTripImages.array("images", 5), tripController.updateTrip);
router.delete("/:id", authorizedMiddleware, tripController.deleteTrip);

// ===== ITINERARY ROUTES =====
router.put("/:id/itinerary", authorizedMiddleware, (req, res) => tripController.updateItinerary(req, res));
router.get("/:id/itinerary", (req, res) => tripController.getItinerary(req, res));

// ===== CHECKLIST ROUTES =====
router.put("/:id/checklist", authorizedMiddleware, (req, res) => tripController.updateChecklist(req, res));
router.get("/:id/checklist", (req, res) => tripController.getChecklist(req, res));

export default router;
