import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import saveQuestionsRouter from './web/routes/save_questions';
import settingsRouter from './web/routes/settings';
import { errorHandler } from './middlewares/error.middleware';
import path from 'path';
import pollConfigRoutes from './web/routes/pollConfigRoutes';
import pollRoutes from './web/routes/pollRoomCodeRoutes';

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
app.use('/api/room-code', pollRoutes);

app.get('/', (_req, res) => {
  res.send('PollGen Backend is running.');
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.use(errorHandler);

export default app;
