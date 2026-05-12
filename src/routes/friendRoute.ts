import express from 'express';
import {
  acceptFiendRequest,
  declineFiendRequest,
  getAllFriends,
  getFriendRequests,
  sendFiendRequest
} from '~/controllers/friendController.js';

const router = express.Router();

router.post('/requests', sendFiendRequest);

router.post('/requests/:requestId/accept', acceptFiendRequest);

router.post('/requests/:requestId/decline', declineFiendRequest);

router.get('/', getAllFriends);

router.get('/requests', getFriendRequests);

export default router;
