import { Request, Response } from 'express';
import User from '~/models/Users.js';

export const authMe = async (req: Request, res: Response) => {
  try {
    const user = req.user;

    return res.status(200).json({
      user
    });
  } catch (error) {
    console.log('Lỗi khi goi authMe', error);
    return res.status(500).json({ message: 'Lỗi hệ thống, vui lòng thử lại sau' });
  }
};

export const searchUserByUsername = async (req: Request, res: Response) => {
  try {
    const { username } = req.query;

    if (!username || (username as string).trim() === '') {
      return res.status(400).json({ message: 'Cần cung cấp username trong query ' });
    }
    const user = await User.findOne({ username: username as string }).select('_id username displayName avatarUrl');

    return res.status(200).json({ user });
  } catch (error) {
    console.log('Lỗi xảy ra khi gọi searchUserByUsername', error);
    return res.status(500).json({ message: 'Lỗi hệ thống, vui lòng thử lại sau' });
  }
};
