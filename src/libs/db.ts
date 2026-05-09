import mongoose from 'mongoose';
import { MONGODB_CONNECTION_STRING } from '~/utils/env.js';

export const connectToDatabase = async () => {
  try {
    await mongoose.connect(MONGODB_CONNECTION_STRING);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};
