import dotenv from 'dotenv';

dotenv.config();

export const PORT = process.env.PORT || 8000;
export const MONGODB_CONNECTION_STRING = process.env.MONGODB_CONNECTION_STRING as string;
export const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || '@secret#key';
export const CLIENT_URL = process.env.CLIENT_URL;
export const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
export const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
export const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
