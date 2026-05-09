import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import Session from '~/models/Session.js';
import User from '~/models/Users.js';
import { ACCESS_TOKEN_SECRET } from '~/utils/env.js';

const ACCESS_TOKEN_TTL = '15m'; //thường là 15p
const REFERSH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000; //dv: ms. 14ngay

export const signUp = async (req: Request, res: Response) => {
  try {
    const { username, password, email, firstName, lastName } = req.body;

    if (!username || !password || !email || !firstName || !lastName) {
      return res.status(401).json({ message: 'Không thể thiếu username, password, email, firstName, lastName' });
    }

    //kiểm tra user có tồn tại chưa
    const duplicate = await User.findOne({ username });
    if (duplicate) {
      return res.status(409).json({ message: 'username đã tồn tại' });
    }

    //mã hoá password
    const hashPassword = await bcrypt.hash(password, 10);

    //tạo user mới
    await User.create({ username, hashPassword, email, displayName: `${firstName} ${lastName}` });

    //return
    return res.status(204);
  } catch (error) {
    console.log('Lỗi khi gọi signUp', error);
    return res.status(500).json({ message: 'Lỗi hệ thống, vui lòng thử lại sau' });
  }
};

export const signIn = async (req: Request, res: Response) => {
  try {
    //lấy input
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ message: 'Thiếu username hoặc password' });
    }

    //lấy hashpassword trong data để so sánh với password
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'username hoặc password không chính xác' });
    }

    //kiểm tra password
    const passwordCorrect = await bcrypt.compare(password, user.hashPassword);
    if (!passwordCorrect) {
      return res.status(401).json({ message: 'username hoặc password không chính xác' });
    }

    // nếu khớp tạo accessToken với JWT
    const accessToken = jwt.sign({ userId: user._id }, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_TTL });

    //tạo refreshToken
    const refreshToken = crypto.randomBytes(64).toString('hex');

    //tạo session để lưu refreshToken
    await Session.create({
      userId: user._id,
      refreshToken,
      expiresAt: new Date(Date.now() + REFERSH_TOKEN_TTL)
    });

    //trả refreshToken trong cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none', //BE, FE deploy riêng. chung là strict
      maxAge: REFERSH_TOKEN_TTL
    });

    //trả accessToken trong res
    return res.status(200).json({ message: `User ${user.displayName} đã logged in thành công`, accessToken });
  } catch (error) {
    console.log('Lỗi khi gọi signIn', error);
    return res.status(500).json({ message: 'Lỗi hệ thống, vui lòng thử lại sau' });
  }
};

export const signOut = async (req: Request, res: Response) => {
  try {
    //lấy refreshToken từ cookie
    const token = req.cookies?.refreshToken;

    if (token) {
      //xoá refreshToken trong cookie
      await Session.deleteOne({ refreshToken: token });

      //xoá cookie
      res.clearCookie('refreshToken');
    }
    return res.status(204);
  } catch (error) {
    console.log('Lỗi khi gọi signOut', error);
    return res.status(500).json({ message: 'Lỗi hệ thống, vui lòng thử lại sau' });
  }
};
