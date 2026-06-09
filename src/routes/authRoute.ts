import express from 'express';
import { changePassword, refreshToken, signIn, signOut, signUp } from '~/controllers/authController.js';
import { protectedRoute } from '~/middlewares/authMiddleware.js';

const router = express.Router();

router.post('/signup', signUp);

router.post('/signin', signIn);

router.post('/signout', signOut);

router.post('/refresh', refreshToken);

router.patch('/change-password', protectedRoute, changePassword);

export default router;
