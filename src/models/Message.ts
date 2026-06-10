import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: ['image', 'text'],
      default: 'text'
    },
    content: {
      type: String,
      trim: true
    },
    imgUrl: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// compound index: index bao gồm nhiều trường
messageSchema.index({ conversationId: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;
