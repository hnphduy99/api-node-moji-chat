import { Request, Response } from 'express';
import Conversation from '~/models/Conversation.js';
import Message from '~/models/Message.js';
import { io } from '~/socket/index.js';
import { emitMessage, updateConversationAfterCreateMessage } from '~/utils/messageHelper.js';

export const sendDirectMessage = async (req: Request, res: Response) => {
  try {
    const { recipientId, content, conversationId } = req.body;
    const senderId = req.user._id;

    if (!content) {
      return res.status(400).json({ message: 'Thiếu nội dung' });
    }

    let conversation;
    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
    }

    if (!conversationId) {
      conversation = await Conversation.create({
        type: 'direct',
        participants: [
          {
            userId: senderId,
            joinAt: new Date()
          },
          {
            userId: recipientId,
            joinAt: new Date()
          }
        ],
        lastMessageAt: new Date(),
        unreadCounts: new Map()
      });
    }

    if (!conversation) {
      return res.status(404).json({ message: 'Không tìm thấy cuộc trò chuyện' });
    }

    const message = await Message.create({
      conversationId: conversation._id,
      senderId,
      content
    });

    updateConversationAfterCreateMessage(conversation, message, senderId);

    await conversation.save();

    emitMessage(io, conversation, message);

    return res.status(201).json({ message });
  } catch (error) {
    console.log('Lỗi xảy ra khi gửi tin nhắn trực tiếp', error);
    return res.status(500).json({ message: 'Lỗi hệ thống, vui lòng thử lại sau' });
  }
};
export const sendGroupMessage = async (req: Request, res: Response) => {
  try {
    const { conversationId, content } = req.body;
    const senderId = req.user._id;
    const conversation = (req as any).conversation;

    if (!content) {
      return res.status(400).json({ message: 'Thiếu nội dung tin nhắn' });
    }

    const message = await Message.create({
      conversationId,
      senderId,
      content
    });

    updateConversationAfterCreateMessage(conversation, message, senderId);

    await conversation.save();

    emitMessage(io, conversation, message);

    return res.status(201).json({ message });
  } catch (error) {
    console.log('Lỗi xảy ra khi gửi tin nhắn nhóm', error);
    return res.status(500).json({ message: 'Lỗi hệ thống, vui lòng thử lại sau' });
  }
};
