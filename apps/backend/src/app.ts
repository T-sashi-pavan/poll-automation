import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import pollRoutes from './routes/poll.routes';
import questionRoutes from './routes/question.routes';
import resultRoutes from './routes/result.routes';
import saveQuestionsRouter from './web/routes/save_questions';
import settingsRouter from './web/routes/settings';
import { errorHandler } from './middlewares/error.middleware';
import path from 'path';
import pollConfigRoutes from './web/routes/pollConfigRoutes';
import pollRoomCodeRoutes from './web/routes/pollRoomCodeRoutes';
import inviteRouter from './routes/invite'; // <-- Add this import

dotenv.config();

const app = express();

app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'], // Added multiple origins
    credentials: true,
  })
);
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/settings', settingsRouter);
app.use('/questions', saveQuestionsRouter);
app.use('/api/poll', pollConfigRoutes);
app.use('/api/room-code', pollRoomCodeRoutes);
app.use('/api/polls', pollRoutes);

app.get('/', (_req, res) => {
  res.send('PollGen Backend is running.');
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/results', resultRoutes);
app.use('/api', inviteRouter); // <-- Add this line after your other app.use() calls

app.use(errorHandler);

export default app;
