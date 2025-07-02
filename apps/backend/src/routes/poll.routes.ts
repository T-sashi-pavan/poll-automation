
import { Router } from 'express';
import { createPoll, getPolls, joinPoll } from '../controllers/poll.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authenticate, createPoll);
router.get('/', getPolls);
router.get('/:pollId', authenticate, joinPoll);

export default router;