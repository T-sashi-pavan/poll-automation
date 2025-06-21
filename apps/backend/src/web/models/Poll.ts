import mongoose, { Document, Schema } from 'mongoose';

export interface Poll extends Document {
  questions: string[]; // or ObjectId[] if referencing
  difficulty: 'Easy' | 'Medium' | 'Hard';
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
}

const pollSchema = new Schema<Poll>({
  questions: [{ type: String, required: true }], // Replace with question IDs if needed
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
});

export default mongoose.model<Poll>('Poll', pollSchema);
