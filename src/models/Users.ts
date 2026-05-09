import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    hashPassword: { type: String, required: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    displayName: { type: String, required: true, trim: true },
    avatarUrl: { type: String },
    avatarId: { type: String },
    bio: { type: String, maxLength: 500 },
    phone: {
      type: String,
      sparse: true //cho phép null, nhưng không được trùng lặp nếu có giá trị
    }
  },
  {
    timestamps: true
  }
);

const User = mongoose.model('User', userSchema);
export default User;
