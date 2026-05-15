import express from 'express';
import { createConversation, getConversations, getMessages, markAsSeen } from '~/controllers/conversationController.js';
import { checkFriendShip } from '~/middlewares/friendMiddleware.js';

const router = express.Router();

router.post('/', checkFriendShip, createConversation);

router.get('/', getConversations);

router.get('/:conversationId/messages', getMessages);

router.patch('/:conversationId/seen', markAsSeen);

export default router;
