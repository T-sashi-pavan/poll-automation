import mongoose, { Document, Schema } from 'mongoose';

export interface IPoll extends Document {
  title: string;
  category: string;
  difficulty: string;
  questions: any[];
  createdBy: mongoose.Types.ObjectId;
  isLive: boolean;
}

const pollSchema = new Schema<IPoll>({
  title: { type: String, required: true },
  category: { type: String, required: true },
  difficulty: { type: String, required: true },
  questions: [{ type: Object, required: true }],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  isLive: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model<IPoll>('Poll', pollSchema);