import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import cors from 'cors';

import { setupWebSocketServer } from './ws/ws-server';
import settingsRouter from './web/routes/settings';
import saveQuestionsRouter from './web/routes/save_questions';
import pollConfigRoutes from './web/routes/pollConfigRoutes';
import transcriptsRouter from './web/routes/transcripts';
import { connectDB } from './web/config/dbconnect';

dotenv.config();

connectDB();

const app = express();
const port = Number(process.env.BACKEND_HTTP_PORT || 3000);
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

app.use('/settings', settingsRouter);
app.use('/questions', saveQuestionsRouter);
app.use('/api/poll', pollConfigRoutes);
app.use('/transcripts', transcriptsRouter);

app.get('/', (_req, res) => {
  res.send('PollGen Backend is running.');
});

// ✅ Hook up WebSocket server here
setupWebSocketServer(server);

server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
