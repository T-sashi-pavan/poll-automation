import mongoose, { Document, Schema } from 'mongoose';

export interface HostSettings extends Document {
  questionFrequencyMinutes: number;
  questionsPerPoll: number;
  visibilityMinutes: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

const hostSettingsSchema = new Schema<HostSettings>({
  questionFrequencyMinutes: { type: Number, required: true, default: 5 },
  questionsPerPoll: { type: Number, required: true, default: 3 },
  visibilityMinutes: { type: Number, required: true, default: 5 },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    required: true,
    default: 'Medium',
  },
});

export default mongoose.model<HostSettings>('HostSettings', hostSettingsSchema);
