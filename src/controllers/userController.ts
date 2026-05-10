import { Request, Response } from 'express';

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
