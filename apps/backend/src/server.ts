import { setupWebSocketServer } from './websocket/connection';
import app from "./app";
import connectDB from "./config/db";
import http from 'http';

const PORT = process.env.PORT || 5003;
const server = http.createServer(app);

setupWebSocketServer(server);

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});