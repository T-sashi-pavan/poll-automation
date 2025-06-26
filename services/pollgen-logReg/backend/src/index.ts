import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

import authRoutes from './routes/authRoutes';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// --- API Routes ---
app.use('/api/auth', authRoutes);

// --- Real-time Socket.IO Setup ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// --- AUTHENTICATE SOCKETS ---
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error: Token not provided'));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
    (socket as any).userId = decoded.id;
    next();
  } catch (err) {
    next(new Error('Authentication error: Invalid token'));
  }
});

// --- Meeting Tracking with Host UserID ---
const meetings = new Map<string, {
  hostSocketId: string,
  hostUserId: string,
  students: Set<string>,
  poll?: any,
  results?: any,
}>();

io.on('connection', (socket) => {
  const userId = (socket as any).userId;
  console.log(`A user connected: ${socket.id} with UserID: ${userId}`);

  const updateStudentCount = (meetingId: string) => {
    const meeting = meetings.get(meetingId);
    if (meeting) {
      io.to(meetingId).emit('update-student-count', meeting.students.size);
    }
  };

  // Host creates a meeting
  socket.on('host-create-meeting', () => {
    const meetingId = uuidv4();
    meetings.set(meetingId, {
      hostSocketId: socket.id,
      hostUserId: userId,
      students: new Set(),
      poll: null,
      results: {},
    });
    socket.join(meetingId);
    console.log(`Host ${userId} created and joined meeting: ${meetingId}`);
    socket.emit('meeting-created', meetingId);
    updateStudentCount(meetingId);
  });

  // Student joins a meeting
  socket.on('student-join-meeting', (meetingId: string) => {
    const meeting = meetings.get(meetingId);
    if (meeting) {
      // Prevent host from joining own meeting as student
      if (meeting.hostUserId === userId) {
        socket.emit('error-joining', { message: "You cannot join your own meeting as a student." });
        return;
      }
      socket.join(meetingId);
      meeting.students.add(socket.id);
      console.log(`Student ${userId} joined meeting: ${meetingId}`);

      io.to(meeting.hostSocketId).emit('student-joined', { studentId: socket.id });
      socket.emit('join-success', meetingId);

      if (meeting.poll) {
        socket.emit('poll-started', meeting.poll);
      }
      updateStudentCount(meetingId);
    } else {
      socket.emit('error-joining', { message: 'The Meeting ID is not valid or has expired.' });
    }
  });

  // Host starts a poll
  socket.on('host-start-poll', ({ meetingId, poll }) => {
    const meeting = meetings.get(meetingId);
    if (meeting && meeting.hostUserId === userId) {
      const initialResults = poll.options.reduce((acc: any, option: string) => {
        acc[option] = 0;
        return acc;
      }, {});
      meeting.poll = poll;
      meeting.results = initialResults;

      io.to(meetingId).emit('poll-started', poll);
      io.to(meetingId).emit('update-results', initialResults);
      console.log(`Poll started in meeting ${meetingId}`);
    }
  });

  // Student votes
  socket.on('student-vote', ({ meetingId, option }) => {
    const meeting = meetings.get(meetingId);
    if (meeting && meeting.results && typeof meeting.results[option] !== 'undefined') {
      meeting.results[option]++;
      io.to(meetingId).emit('update-results', meeting.results);
    }
  });

  // Host ends poll
  socket.on('host-end-poll', ({ meetingId }) => {
    const meeting = meetings.get(meetingId);
    if (meeting && meeting.hostUserId === userId) {
      meeting.poll = null;
      console.log(`Poll ended in meeting ${meetingId}`);
      io.to(meetingId).emit('poll-ended');
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id} (UserID: ${userId})`);
    for (const [meetingId, room] of meetings.entries()) {
      if (room.hostSocketId === socket.id) {
        io.to(meetingId).emit('meeting-ended');
        meetings.delete(meetingId);
        console.log(`Meeting ${meetingId} ended because host disconnected.`);
        break;
      }
      if (room.students.has(socket.id)) {
        room.students.delete(socket.id);
        updateStudentCount(meetingId);
        break;
      }
    }
  });
});

// --- Database Connection and Server Start ---
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI as string)
  .then(() => {
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((error) => {
    console.error('Database connection failed:', error.message);
  });
