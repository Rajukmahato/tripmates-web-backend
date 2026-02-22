import { Router } from "express";
import { destinationController } from "../controllers/destination.controller";
import { authorizedMiddleware } from "../middlewares/auth.middleware";
import { adminMiddleware } from "../middlewares/admin.middleware";
import { uploadDestinationImage } from "../middlewares/upload.middleware";

const router = Router();

router.get("/", (req, res) => destinationController.getAllDestinations(req, res));
router.get("/search", (req, res) => destinationController.searchDestinations(req, res));
router.get("/admin/stats", authorizedMiddleware, adminMiddleware, (req, res) =>
    destinationController.getDestinationStats(req, res)
);
router.get("/:id", (req, res) => destinationController.getDestinationById(req, res));

router.post("/", authorizedMiddleware, adminMiddleware, uploadDestinationImage.single("coverImage"), (req, res) =>
    destinationController.createDestination(req, res)
);
router.put("/:id", authorizedMiddleware, adminMiddleware, uploadDestinationImage.single("coverImage"), (req, res) =>
    destinationController.updateDestination(req, res)
);
router.delete("/:id", authorizedMiddleware, adminMiddleware, (req, res) =>
    destinationController.deleteDestination(req, res)
);
router.put("/:id/status", authorizedMiddleware, adminMiddleware, (req, res) =>
    destinationController.updateDestinationStatus(req, res)
);

export default router;
