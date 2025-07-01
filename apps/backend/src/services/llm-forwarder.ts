import axios from 'axios';
import dotenv from 'dotenv';
import { ServerToClientMessage } from '@poll-automation/types';
import {
  TranscriptChunk,
  TranscriptSegment
} from '@poll-automation/types';

dotenv.config();

const LLM_FORWARD_URL = process.env.LLM_FORWARD_URL || '';

type MeetingBuffer = {
  transcripts: TranscriptSegment[];
  timeout: NodeJS.Timeout;
  chunkStart: number;
  chunkEnd: number;
};

const buffers = new Map<string, MeetingBuffer>();

export function forwardToLLMBuffer(msg: ServerToClientMessage): void {
  const { meetingId, guestId, start, end, text } = msg;
  if (!meetingId) return;

  if (!buffers.has(meetingId)) {
    const buffer: MeetingBuffer = {
      transcripts: [],
      chunkStart: start,
      chunkEnd: end,
      timeout: setTimeout(() => flushBuffer(meetingId), 30_000)
    };
    buffers.set(meetingId, buffer);
  }

  const buffer = buffers.get(meetingId)!;

  buffer.transcripts.push({ guestId, start, end, text });

  // Update time range
  buffer.chunkEnd = Math.max(buffer.chunkEnd, end);
}

async function flushBuffer(meetingId: string): Promise<void> {
  const buffer = buffers.get(meetingId);
  if (!buffer || buffer.transcripts.length === 0) return;

  const payload: TranscriptChunk = {
    meetingId,
    chunkStart: buffer.chunkStart,
    chunkEnd: buffer.chunkEnd,
    transcripts: buffer.transcripts
  };

  try {
    await axios.post(LLM_FORWARD_URL, payload);
    console.log(`✅ Forwarded transcript chunk for meeting ${meetingId}`);
  } catch (err) {
    console.error(`❌ Failed to forward transcript for ${meetingId}`, err);
  } finally {
    // Clear buffer for next cycle
    clearTimeout(buffer.timeout);
    buffers.delete(meetingId);
  }
}
