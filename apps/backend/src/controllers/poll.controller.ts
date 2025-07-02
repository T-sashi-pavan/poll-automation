import { Request, Response } from 'express';
import Poll from '../models/poll.model';

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const createPoll = async (req: Request, res: Response) => {
  try {
    const { title, category, difficulty, questions } = req.body;
    if (!title || !category || !difficulty || !questions) {
      throw new ValidationError('All fields are required');
    }
    const poll = await Poll.create({
      title,
      category,
      difficulty,
      questions,
      createdBy: (req as any).user.id
    });
    res.status(201).json(poll);
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ message: error.message });
    } else {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
};

export const getPolls = async (req: Request, res: Response) => {
  try {
    const polls = await Poll.find();
    if (!polls) {
      throw new ValidationError('No polls found');
    }
    res.json(polls);
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ message: error.message });
    } else {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
};

export const joinPoll = async (req: Request, res: Response) => {
  try {
    const { pollId } = req.params;
    if (!pollId) {
      throw new ValidationError('Poll ID is required');
    }
    const poll = await Poll.findById(pollId);
    if (!poll) {
      throw new ValidationError('Poll not found');
    }
    res.json(poll);
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ message: error.message });
    } else {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
};