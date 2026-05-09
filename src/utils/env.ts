import dotenv from 'dotenv';

dotenv.config();

export const PORT = process.env.PORT || 8000;
export const MONGODB_CONNECTION_STRING = process.env.MONGODB_CONNECTION_STRING as string;
export const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || '@secret#key';
