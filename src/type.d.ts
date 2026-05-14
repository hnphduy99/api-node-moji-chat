import type { Document } from 'mongoose';
import 'socket.io';

declare global {
  namespace Express {
    interface Request {
      user?: any;
      conversation?: any;
    }
  }
}

declare module 'socket.io' {
  interface Socket {
    user: Document & {
      _id: string;
      displayName: string;
      email: string;
      username: string;
      avatarUrl?: string | null;
      avatarId?: string | null;
      bio?: string | null;
      phone?: string | null;
    };
  }
}

export {};
