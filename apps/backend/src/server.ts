import dotenv from 'dotenv';
// Load environment variables first
dotenv.config();

import { setupWebSocketServer } from './websocket/connection';
import app from './app';
import connectDB from './config/db';
import http from 'http';

const PORT = process.env.PORT || 3000; // Changed from 5003 to 3000 to match .env
const server = http.createServer(app);

setupWebSocketServer(server);

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
