import cookieParser from 'cookie-parser';
import express from 'express';
import { setServers } from 'node:dns/promises';
import { connectToDatabase } from './libs/db.js';
import { protectedRoute } from './middlewares/authMiddleware.js';
import authRoute from './routes/authRoute.js';
import userRoute from './routes/userRoute.js';
import { PORT } from './utils/env.js';

setServers(['1.1.1.1', '8.8.8.8']);

const app = express();
const port = PORT;

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cookieParser());
//public routes
app.use('/api/auth', authRoute);

//private routes
app.use(protectedRoute);
app.use('/api/users', userRoute);

connectToDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('Failed to connect to the database:', error);
  });
