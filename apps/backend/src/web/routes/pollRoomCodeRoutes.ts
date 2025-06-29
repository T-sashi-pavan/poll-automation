import { Router } from 'express';
import {
  createPoll,
  getAllPolls,
  getPollById,
  updatePoll,
} from '../controllers/pollRoomCodeController';

const router = Router();

router.post('/polls', createPoll);
router.get('/polls', getAllPolls);
router.get('/polls/:id', getPollById);
router.put('/polls/:id', updatePoll);

export default router;
