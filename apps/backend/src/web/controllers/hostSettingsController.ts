import { Request, Response } from 'express';
import HostSettingsModel from '../models/HostSettings';

export const getHostSettings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const settings = await HostSettingsModel.find().lean();
    if (!settings) {
      res.status(404).json({ message: 'Settings not found' });
      return;
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching settings', error });
  }
};

export const updateHostSettings = async (
  req: Request,
  res: Response
): Promise<void> => {
  const {
    questionFrequencyMinutes,
    questionsPerPoll,
    visibilityMinutes,
    difficulty,
  } = req.body;
  try {
    let settings = await HostSettingsModel.findOne();
    if (!settings) {
      settings = new HostSettingsModel({
        questionFrequencyMinutes,
        questionsPerPoll,
        visibilityMinutes,
        difficulty,
      });
    } else {
      settings.questionFrequencyMinutes = questionFrequencyMinutes;
      settings.questionsPerPoll = questionsPerPoll;
      settings.visibilityMinutes = visibilityMinutes;
      settings.difficulty = difficulty;
    }
    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Error updating settings', error });
  }
};

export const addHostSettings = async (
  req: Request,
  res: Response
): Promise<void> => {
  const {
    questionFrequencyMinutes,
    questionsPerPoll,
    visibilityMinutes,
    difficulty,
  } = req.body;
  try {
    const newSettings = new HostSettingsModel({
      questionFrequencyMinutes,
      questionsPerPoll,
      visibilityMinutes,
      difficulty,
    });
    await newSettings.save();
    res.status(201).json(newSettings);
  } catch (error) {
    res.status(500).json({ message: 'Error adding settings', error });
  }
};
