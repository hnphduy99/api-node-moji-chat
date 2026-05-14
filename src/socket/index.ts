import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { getUserConversationsForSocketIO } from '~/controllers/conversationController.js';
import { socketAuthMiddleware } from '~/middlewares/socketMiddleware.js';
import { CLIENT_URL } from '~/utils/env.js';

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    credentials: true
  }
});

io.use(socketAuthMiddleware);

const onlineUsers = new Map();

io.on('connection', async (socket) => {
  const user = socket.user;
  console.log(`${user.displayName} online with socket ${socket.id}`);

  onlineUsers.set(user._id, socket.id);

  io.emit('online-users', Array.from(onlineUsers.keys()));

  const conversationIds = await getUserConversationsForSocketIO(user._id);
  conversationIds?.forEach((id) => socket.join(id));

  socket.on('disconnect', () => {
    onlineUsers.delete(user._id);
    io.emit('online-users', Array.from(onlineUsers.keys()));
    console.log(`socket disconnected: ${socket.id}`);
  });
});

export { app, io, server };
