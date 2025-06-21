import express from 'express';
import http from 'http';
import { setupWebSocketServer } from './websocket/connection';
import settingsRouter from './web/routes/settings';
import dotenv from 'dotenv';
import cors from 'cors';
import saveQuestionsRouter from './web/routes/save_questions';
import { connectDB } from './web/config/dbconnect';
import pollConfigRoutes from './web/routes/pollConfigRoutes';
dotenv.config();

connectDB();

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());
app.use('/settings', settingsRouter);
app.use('/questions', saveQuestionsRouter);
app.use('/api/poll', pollConfigRoutes);
app.get('/', (_req, res) => {
  res.send('PollGen Backend is running.');
});

setupWebSocketServer(server);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
