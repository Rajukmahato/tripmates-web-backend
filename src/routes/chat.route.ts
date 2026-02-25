import { Router } from "express";
import { chatController } from "../controllers/chat.controller";
import { authorizedMiddleware } from "../middlewares/auth.middleware";

const router = Router();

// All chat routes require authentication
router.use(authorizedMiddleware);

/**
 * @route   GET /api/chat/conversations
 * @desc    Get all conversations for current user
 * @access  Private
 */
router.get("/conversations", (req, res) => chatController.getConversations(req, res));

/**
 * @route   POST /api/chat/conversations/ensure
 * @desc    Ensure a conversation exists between current user and another user
 * @access  Private
 */
router.post("/conversations/ensure", (req, res) =>
	chatController.ensureConversation(req, res)
);

/**
 * @route   GET /api/chat/messages/:userId
 * @desc    Get message history with a specific user
 * @access  Private
 */
router.get("/messages/:userId", (req, res) => chatController.getMessages(req, res));

/**
 * @route   POST /api/chat/messages
 * @desc    Send a message
 * @access  Private
 */
router.post("/messages", (req, res) => chatController.sendMessage(req, res));

/**
 * @route   PUT /api/chat/messages/:userId/read
 * @desc    Mark messages from a user as read
 * @access  Private
 */
router.put("/messages/:userId/read", (req, res) => chatController.markAsRead(req, res));

/**
 * @route   GET /api/chat/unread-count
 * @desc    Get unread message count
 * @access  Private
 */
router.get("/unread-count", (req, res) => chatController.getUnreadCount(req, res));

/**
 * @route   GET /api/chat/groups
 * @desc    Get group chats for current user
 * @access  Private
 */
router.get("/groups", (req, res) => chatController.getGroupChats(req, res));

// ===== GROUP CHAT ROUTES =====

/**
 * @route   POST /api/chat/groups
 * @desc    Create a group chat for a trip
 * @access  Private
 */
router.post("/groups", (req, res) => chatController.createGroup(req, res));

/**
 * @route   GET /api/chat/groups/:tripId
 * @desc    Get group chat for a trip
 * @access  Private
 */
router.get("/groups/chat/:groupChatId", (req, res) => chatController.getGroupChat(req, res));

/**
 * @route   GET /api/chat/groups/:tripId
 * @desc    Get group chat for a trip
 * @access  Private
 */
router.get("/groups/:tripId", (req, res) => chatController.getGroupByTrip(req, res));

/**
 * @route   POST /api/chat/groups/:groupId/members
 * @desc    Add member to group
 * @access  Private
 */
router.post("/groups/:groupId/members", (req, res) => chatController.addGroupMember(req, res));

/**
 * @route   DELETE /api/chat/groups/:groupId/members/:userId
 * @desc    Remove member from group
 * @access  Private
 */
router.delete("/groups/:groupId/members/:userId", (req, res) => chatController.removeGroupMember(req, res));

/**
 * @route   GET /api/chat/groups/:groupId/messages
 * @desc    Get group chat messages
 * @access  Private
 */
router.get("/groups/:groupId/messages", (req, res) => chatController.getGroupMessages(req, res));

/**
 * @route   POST /api/chat/groups/:groupId/messages
 * @desc    Send message to group
 * @access  Private
 */
router.post("/groups/:groupId/messages", (req, res) => chatController.sendGroupMessage(req, res));

export default router;
