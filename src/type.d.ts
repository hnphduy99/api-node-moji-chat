declare global {
  namespace Express {
    interface Request {
      user?: any;
      conversation?: any;
    }
  }
}

export {};
