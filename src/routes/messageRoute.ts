import express from 'express';
import { sendDirectMessage, sendGroupMessage, uploadMessageFile } from '~/controllers/messageController.js';
import { checkFriendShip, checkGroupMembership } from '~/middlewares/friendMiddleware.js';
import { upload } from '~/middlewares/uploadMiddleware.js';

const router = express.Router();

router.post('/direct', checkFriendShip, sendDirectMessage);

router.post('/group', checkGroupMembership, sendGroupMessage);

router.post('/uploadFile', upload.single('file'), uploadMessageFile);

export default router;
