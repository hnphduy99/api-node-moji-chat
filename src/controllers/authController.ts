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
    return res.sendStatus(204);
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
    return res.sendStatus(204);
  } catch (error) {
    console.log('Lỗi khi gọi signOut', error);
    return res.status(500).json({ message: 'Lỗi hệ thống, vui lòng thử lại sau' });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    // lấy refreshToken từ cookie
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ message: 'Token không tồn tại' });
    }
    // so với refresh token trong db
    const session = await Session.findOne({ refreshToken: token });
    if (!session) {
      return res.status(403).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
    }
    // kiểm tra hết hạn chưa
    if (session.expiresAt < new Date()) {
      return res.status(403).json({ message: 'Token đã hết hạn' });
    }
    // tạo accessToken mới
    const accessToken = jwt.sign({ userId: session.userId }, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_TTL });

    // return
    return res.status(200).json({ accessToken });
  } catch (error) {
    console.log('Lỗi khi gọi refreshToken', error);
    return res.status(500).json({ message: 'Lỗi hệ thống, vui lòng thử lại sau' });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Vui lòng nhập mật khẩu cũ và mật khẩu mới' });
    }

    const user = await User.findOne({ _id: req.user._id });
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy user' });
    }

    const passwordCorrect = await bcrypt.compare(currentPassword, user.hashPassword);
    if (!passwordCorrect) {
      return res.status(401).json({ message: 'Mật khẩu cũ không chính xác' });
    }

    const hashNewPassword = await bcrypt.hash(newPassword, 10);
    await User.updateOne({ _id: req.user._id }, { hashPassword: hashNewPassword });

    return res.status(200).json({ message: 'Mật khẩu đã được thay đổi thành công' });
  } catch (error) {
    console.log('Lỗi khi gọi changePassword', error);
    return res.status(500).json({ message: 'Lỗi hệ thống, vui lòng thử lại sau' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Vui lòng nhập email' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy user với email này' });
    }

    // Tạo token ски
    const resetToken = crypto.randomBytes(64).toString('hex');

    // Lưu token vào session tạm thời
    await Session.create({
      userId: user._id,
      refreshToken: resetToken,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 phút
    });

    // Gửi email chứa link reset (trong thực tế cần tích hợp SMTP hoặc dịch vụ email)
    console.log(`Gửi reset link tới email: ${email}. Token: ${resetToken}`);

    return res.status(200).json({ message: 'Link reset đã được gửi tới email của bạn' });
  } catch (error) {
    console.log('Lỗi khi gọi forgotPassword', error);
    return res.status(500).json({ message: 'Lỗi hệ thống, vui lòng thử lại sau' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token và mật khẩu mới là bắt buộc' });
    }

    // Tìm session dựa trên token (đã lưu ở bước forgotPassword)
    const session = await Session.findOne({ refreshToken: token });
    if (!session) {
      return res.status(404).json({ message: 'Token không tồn tại hoặc đã hết hạn' });
    }

    // Kiểm tra token có hết hạn không
    if (session.expiresAt < new Date()) {
      return res.status(403).json({ message: 'Token đã hết hạn. Vui lòng yêu cầu lại forgot password' });
    }

    // Mã hóa mật khẩu mới
    const hashPassword = await bcrypt.hash(newPassword, 10);

    // Cập nhật mật khẩu cho user
    await User.updateOne({ _id: session.userId }, { hashPassword });

    // Xóa session/token này đi sau khi đã sử dụng
    await Session.deleteOne({ _id: session._id });

    return res.status(200).json({ message: 'Mật khẩu đã được đặt lại thành công' });
  } catch (error) {
    console.log('Lỗi khi gọi resetPassword', error);
    return res.status(500).json({ message: 'Lỗi hệ thống, vui lòng thử lại sau' });
  }
};
