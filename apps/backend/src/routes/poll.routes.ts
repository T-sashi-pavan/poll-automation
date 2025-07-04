import { Router } from 'express';
import { createPoll, getPolls, joinPoll } from '../controllers/poll.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { sendPollToStudents } from '../websocket/studentWebSocket';

const router = Router();

router.post('/', authenticate, createPoll);
router.get('/', getPolls);
router.get('/:pollId', authenticate, joinPoll);

// Route to trigger sending polls to students
router.post('/send-to-students', authenticate, async (req, res) => {
  try {
    const result = await sendPollToStudents();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Test route to trigger sending polls without authentication (for testing)
router.post('/test-send', async (req, res) => {
  try {
    const result = await sendPollToStudents();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
