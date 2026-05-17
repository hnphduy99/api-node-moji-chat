import { Request, Response } from 'express';
import { uploadImageFromBuffer } from '~/middlewares/uploadMiddleware.js';
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

export const uploadAvatar = async (req: Request, res: Response) => {
  try {
    const file = req.file;
    const userId = req.user._id;

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const result = await uploadImageFromBuffer(file.buffer);

    const updatedUser = await User.findOneAndUpdate(
      { _id: userId },
      { avatarUrl: result.secure_url, avatarId: result.public_id },
      { returnDocument: 'after' }
    ).select('avatarUrl');

    if (!updatedUser?.avatarUrl) {
      return res.status(400).json({ message: 'Avatar trả về null' });
    }

    return res.status(200).json({ avatarUrl: updatedUser.avatarUrl });
  } catch (error) {
    console.error('Lỗi xảy ra khi upload avatar', error);
    return res.status(500).json({ message: 'Lỗi hệ thống, vui lòng thử lại sau' });
  }
};
