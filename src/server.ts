import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { setServers } from 'node:dns/promises';
import { connectToDatabase } from './libs/db.js';
import { protectedRoute } from './middlewares/authMiddleware.js';
import authRoute from './routes/authRoute.js';
import conversationRoute from './routes/conversationRoute.js';
import friendRoute from './routes/friendRoute.js';
import messageRoute from './routes/messageRoute.js';
import userRoute from './routes/userRoute.js';
import { app, server } from './socket/index.js';
import { CLIENT_URL, PORT } from './utils/env.js';

setServers(['1.1.1.1', '8.8.8.8']); //truy cap mongodb

const port = PORT;

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: CLIENT_URL, credentials: true }));
//public routes
app.use('/api/auth', authRoute);

//private routes
app.use(protectedRoute);
app.use('/api/users', userRoute);
app.use('/api/friends', friendRoute);
app.use('/api/messages', messageRoute);
app.use('/api/conversations', conversationRoute);

connectToDatabase()
  .then(() => {
    server.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('Failed to connect to the database:', error);
  });
