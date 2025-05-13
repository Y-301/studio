
import type { Request, Response } from 'express';
import * as settingsService from '../services/settingsService';
import { log } from '../services/logService';
import type { UserSettings } from '../models/settings';

const DEFAULT_MOCK_USER_ID_IF_NO_AUTH = 'user1';

export const getUserSettings = async (req: Request, res: Response) => {
  // The frontend passes userId in the path for settings for now
  const userId = req.params.userId || (req.headers['x-user-id'] as string) || DEFAULT_MOCK_USER_ID_IF_NO_AUTH;

  if (!userId) {
    log('warn', 'User ID is required for getUserSettings.', undefined, { params: req.params, component: 'SettingsController' });
    return res.status(400).json({ message: 'User ID is required.' });
  }

  try {
    const settings = await settingsService.getUserSettings(userId);
    res.status(200).json(settings);
  } catch (error) {
    console.error(`Error fetching settings for user ${userId}:`, error);
    log('error', `Error fetching settings for user ${userId}: ${(error as Error).message}`, userId, { component: 'SettingsController', stack: (error as Error).stack });
    res.status(500).json({ message: 'Failed to get user settings.' });
  }
};

export const updateUserSettings = async (req: Request, res: Response) => {
  const userId = req.params.userId || (req.headers['x-user-id'] as string) || DEFAULT_MOCK_USER_ID_IF_NO_AUTH;
  const updates = req.body as Partial<Omit<UserSettings, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;


  if (!userId) {
    log('warn', 'User ID is required for updateUserSettings.', undefined, { params: req.params, component: 'SettingsController' });
    return res.status(400).json({ message: 'User ID is required.' });
  }
  if (Object.keys(updates).length === 0) {
    log('warn', 'No settings provided to update for user.', userId, { body: req.body, component: 'SettingsController' });
    return res.status(400).json({ message: 'No settings provided to update.' });
  }
  
  if (updates.theme && !['light', 'dark', 'system'].includes(updates.theme)) {
      log('warn', `Invalid theme value: ${updates.theme}`, userId, { component: 'SettingsController' });
      return res.status(400).json({ message: 'Invalid theme value. Must be light, dark, or system.' });
  }
  if (updates.notifications) {
      if (updates.notifications.email !== undefined && typeof updates.notifications.email !== 'boolean') {
          return res.status(400).json({message: 'Invalid email notification setting.'});
      }
      if (updates.notifications.push !== undefined && typeof updates.notifications.push !== 'boolean') {
          return res.status(400).json({message: 'Invalid push notification setting.'});
      }
  }

  try {
    const updatedSettings = await settingsService.updateUserSettings(userId, updates);
    if (!updatedSettings) {
        return res.status(404).json({ message: 'Settings not found or update failed.' });
    }
    log('info', `User settings updated successfully for ${userId}`, userId, { component: 'SettingsController', updates: Object.keys(updates) });
    res.status(200).json(updatedSettings);
  } catch (error) {
    console.error(`Error updating settings for user ${userId}:`, error);
    log('error', `Error updating settings for user ${userId}: ${(error as Error).message}`, userId, { component: 'SettingsController', stack: (error as Error).stack });
    res.status(500).json({ message: 'Failed to update user settings.' });
  }
};
