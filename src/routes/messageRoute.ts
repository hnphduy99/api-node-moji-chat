import express from 'express';
import { sendDirectMessage, sendGroupMessage } from '~/controllers/messageController.js';
import { checkFriendShip, checkGroupMembership } from '~/middlewares/friendMiddleware.js';

const router = express.Router();

router.post('/direct', checkFriendShip, sendDirectMessage);

router.post('/group', checkGroupMembership, sendGroupMessage);

export default router;
