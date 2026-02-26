import { Router } from "express";
import { notificationController } from "../controllers/notification.controller";
import { authorizedMiddleware } from "../middlewares/auth.middleware";

const router = Router();

// All notification routes require authentication
router.use(authorizedMiddleware);

/**
 * @route   POST /api/notifications/register-token
 * @desc    Register FCM device token
 * @access  Private
 */
router.post("/register-token", (req, res) => notificationController.registerToken(req, res));

/**
 * @route   GET /api/notifications
 * @desc    Get notifications for current user
 * @access  Private
 */
router.get("/", (req, res) => notificationController.getNotifications(req, res));

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notification count
 * @access  Private
 */
router.get("/unread-count", (req, res) => notificationController.getUnreadCount(req, res));

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.put("/read-all", (req, res) => notificationController.markAllAsRead(req, res));

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.put("/:id/read", (req, res) => notificationController.markAsRead(req, res));

export default router;
