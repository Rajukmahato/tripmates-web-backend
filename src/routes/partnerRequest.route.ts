import { Router } from "express";
import { PartnerRequestController } from "../controllers/partnerRequest.controller";
import { authorizedMiddleware } from "../middlewares/auth.middleware";

const partnerRequestController = new PartnerRequestController();
const router = Router();

// All partner request routes require authentication
router.use(authorizedMiddleware);

// Send a partner request
router.post("/", partnerRequestController.sendRequest);

// Get received requests (as trip creator)
router.get("/received", partnerRequestController.getReceivedRequests);

// Get sent requests (as traveler)
router.get("/sent", partnerRequestController.getSentRequests);

// Get specific request by ID
router.get("/:id", partnerRequestController.getRequestById);

// Accept or reject a request (trip creator only)
router.put("/:id/status", partnerRequestController.updateRequestStatus);

// Cancel a sent request (sender only)
router.delete("/:id", partnerRequestController.cancelRequest);

export default router;
