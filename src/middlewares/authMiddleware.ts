import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload, VerifyErrors } from 'jsonwebtoken';
import User from '~/models/Users.js';
import { ACCESS_TOKEN_SECRET } from '~/utils/env.js';

interface DecodedUser extends JwtPayload {
  userId: string;
}

export const protectedRoute = (req: Request, res: Response, next: NextFunction) => {
  try {
    //lấy accessToken
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; //Bearer <token>

    if (!token) {
      return res.status(401).json({ message: 'Không tìm thấy accessToken' });
    }

    //xác nhận token hợp lệ
    jwt.verify(token, ACCESS_TOKEN_SECRET, async (error: VerifyErrors | null, decodedUser) => {
      if (error) {
        console.log(error);
        return res.status(403).json({ message: 'accessToken hết hạn hoặc không đúng' });
      }

      const decoded = decodedUser as DecodedUser;

      //tìm user
      const user = await User.findById(decoded.userId).select('-hashPassword');

      if (!user) {
        return res.status(404).json({
          message: 'Người dùng không tồn tại'
        });
      }

      //trả user trong req
      req.user = user;

      next();
    });
  } catch (error) {
    console.log('Lỗi khi xác minh jwt trong authMiddleware', error);
    return res.status(500).json({ message: 'Lỗi hệ thống, vui lòng thử lại sau' });
  }
};
