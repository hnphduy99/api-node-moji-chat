import jwt, { type JwtPayload } from 'jsonwebtoken';
import { Socket } from 'socket.io';
import User from '~/models/Users.js';
import { ACCESS_TOKEN_SECRET } from '~/utils/env.js';

export const socketAuthMiddleware = async (socket: Socket, next: (err?: Error) => void) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Unauthorized - Token không tồn tại'));

    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as JwtPayload;
    if (!decoded?.userId) return next(new Error('Unauthorized - Token không tồn tại hoặc đã hết hạn'));

    const user = await User.findById(decoded.userId).select('-hashPassword');
    if (!user) return next(new Error('User không tồn tại'));

    socket.user = user as any;

    next();
  } catch (error) {
    console.error('Lỗi khi verify JWT trong socketMiddleware', error);
    next(new Error('Unauthorized'));
  }
};
