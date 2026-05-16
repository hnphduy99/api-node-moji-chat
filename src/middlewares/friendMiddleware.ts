import { NextFunction, Request, Response } from 'express';
import Conversation from '~/models/Conversation.js';
import Friend from '~/models/Friend.js';

const pair = (a: string, b: string) => (a < b ? [a, b] : [b, a]);

export const checkFriendShip = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const me = req.user._id.toString();
    const recipientId = req.body?.recipientId ?? null;
    const memberIds = req.body?.memberIds;

    if (!recipientId && memberIds.length === 0) {
      return res.status(400).json({ message: 'Cần cung cấp recipientId hoặc memberIds' });
    }

    if (recipientId) {
      const [userA, userB] = pair(me, recipientId);

      const isFriend = await Friend.findOne({ userA, userB });

      if (!isFriend) {
        return res.status(403).json({ message: 'Bạn chưa kết bạn với người này' });
      }

      return next();
    }

    const friendChecks = await memberIds.map(async (memberId: string) => {
      const [userA, userB] = pair(me, memberId);
      const friend = await Friend.findOne({ userA, userB });
      return friend ? null : memberId;
    });

    const result = await Promise.all(friendChecks);
    const notFriends = result.filter(Boolean);

    if (notFriends.length > 0) {
      return res.status(403).json({ message: 'Bạn chỉ có thể thêm bạn bè vào nhóm', notFriends });
    }

    next();
  } catch (error) {
    console.log('Lỗi xảy ra khi checkFriendShip', error);
    return res.status(500).json({ message: 'Lỗi hệ thống, vui lòng thử lại sau' });
  }
};

export const checkGroupMembership = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { conversationId } = req.body;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: 'Không tìm thấy cuộc trò chuyện' });
    }

    const isMember = conversation?.participants.some((p) => p.userId.toString() === userId.toString());

    if (!isMember) {
      return res.status(403).json({ message: 'Bạn không ở trong group này' });
    }

    req.conversation = conversation;

    next();
  } catch (error) {
    console.log('Lỗi xảy ra khi checkGroupMembership', error);
    return res.status(500).json({ message: 'Lỗi hệ thống, vui lòng thử lại sau' });
  }
};
