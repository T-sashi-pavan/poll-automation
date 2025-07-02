import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import pollRoutes from './routes/poll.routes';
import userRoutes from './routes/user.routes';
import { errorHandler } from './middlewares/error.middleware';
import path from "path";

dotenv.config();

const app = express();

app.use(cors({
  origin: 'http://localhost:5173', // frontend URL
  credentials: true
}));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));


app.use('/api/auth', authRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/users', userRoutes);

app.use(errorHandler);

export default app;