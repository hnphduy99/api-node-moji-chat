import { Request, Response } from 'express';
import Conversation from '~/models/Conversation.js';
import Message from '~/models/Message.js';

type PopulatedUser = {
  id?: string;
  displayName?: string;
  avatarUrl?: string | null;
};

export const createConversation = async (req: Request, res: Response) => {
  try {
    const { type, name, memberIds } = req.body;
    const userId = req.user._id;

    if (!type || (type === 'group' && !name) || !memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ message: 'Tên nhóm và danh sách thành viên là bắt buộc' });
    }

    let conversation;
    if (type === 'direct') {
      const participantId = memberIds[0];

      conversation = await Conversation.findOne({
        type: 'direct',
        'participants.userId': { $all: [userId, participantId] }
      });

      if (!conversation) {
        conversation = new Conversation({
          type: 'direct',
          participants: [{ userId }, { userId: participantId }],
          lastMessageAt: new Date()
        });

        await conversation.save();
      }
    }

    if (type === 'group') {
      conversation = new Conversation({
        type: 'group',
        participants: [{ userId }, ...memberIds.map((id) => ({ userId: id }))],
        group: {
          name,
          createdBy: userId
        },
        lastMessageAt: new Date()
      });

      await conversation.save();
    }

    if (!conversation) {
      res.status(400).json({ message: 'Conversation type không hợp lệ' });
    }

    await conversation?.populate([
      {
        path: 'participants.userId',
        select: 'displayName avatarUrl'
      },
      {
        path: 'seenBy',
        select: 'displayName avatarUrl'
      },
      {
        path: 'lastMessage.senderId',
        select: 'displayName avatarUrl'
      }
    ]);

    return res.status(201).json({ conversation });
  } catch (error) {
    console.log('Lỗi khi tạo cuộc trò chuyện', error);
    return res.status(500).json({ message: 'Lỗi hệ thống, vui lòng thử lại sau' });
  }
};
export const getConversations = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;
    const conversations = await Conversation.find({
      'participants.userId': userId
    })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .populate({
        path: 'participants.userId',
        select: 'displayName avatarUrl'
      })
      .populate({
        path: 'lastMessage.senderId',
        select: 'displayName avatarUrl'
      });

    const formatted = conversations.map((i) => {
      const participants = (i.participants || []).map((p) => {
        const user = p.userId as unknown as PopulatedUser;

        return {
          _id: user.id,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl ?? null,
          joinAt: p.joinedAt
        };
      });

      return {
        ...i.toObject(),
        unreadCounts: i.unreadCounts || {},
        participants
      };
    });

    return res.status(200).json({ conversations: formatted });
  } catch (error) {
    console.log('Lỗi xảy ra khi lấy conversations', error);
    return res.status(500).json({ message: 'Lỗi hệ thống, vui lòng thử lại sau' });
  }
};
export const getMessages = async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50, cursor } = req.query;

    const query: Record<string, unknown> = { conversationId };
    if (cursor) {
      query.createdAt = { $lt: new Date(cursor as string) };
    }

    let messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit) + 1);

    let nextCursor = null;

    if (messages.length > Number(limit)) {
      const nextMessage = messages[messages.length - 1];
      nextCursor = nextMessage.createdAt.toISOString();
      messages.pop();
    }

    messages = messages.reverse();

    return res.status(200).json({ messages, nextCursor });
  } catch (error) {
    console.log('Lỗi xảy ra khi lấy messages', error);
    return res.status(500).json({ message: 'Lỗi hệ thống, vui lòng thử lại sau' });
  }
};

export const getUserConversationsForSocketIO = async (userId: string) => {
  try {
    const conversation = await Conversation.find(
      {
        'participants.userId': userId
      },
      { _id: 1 }
    );
    return conversation.map((c) => c._id.toString());
  } catch (error) {
    console.error('Lỗi khi fetch conversations: ', error);
    return [];
  }
};
