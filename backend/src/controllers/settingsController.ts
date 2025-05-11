
import type { Request, Response } from 'express';
import { UserSettings, getDefaultUserSettings } from '../models/settings';
import { getItemById, upsertItem } from '../utils/jsonDb';

const SETTINGS_DB_FILE = 'settings.json';

export const getUserSettings = async (req: Request, res: Response) => {
  const { userId } = req.params;
  if (!userId) {
    return res.status(400).json({ message: 'User ID is required.' });
  }

  try {
    let settings = await getItemById<UserSettings>(SETTINGS_DB_FILE, userId);
    if (!settings) {
      // If no settings found, create default settings for the user
      console.log(`No settings found for user ${userId}. Creating default settings.`);
      settings = getDefaultUserSettings(userId);
      await upsertItem<UserSettings>(SETTINGS_DB_FILE, userId, settings);
    }
    res.status(200).json(settings);
  } catch (error) {
    console.error(`Error fetching settings for user ${userId}:`, error);
    res.status(500).json({ message: 'Failed to get user settings.' });
  }
};

export const updateUserSettings = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const updates = req.body as Partial<UserSettings>;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required.' });
  }
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: 'No settings provided to update.' });
  }

  try {
    const existingSettings = await getItemById<UserSettings>(SETTINGS_DB_FILE, userId) || getDefaultUserSettings(userId);
    
    // Merge updates with existing settings
    // Ensure userId is not overwritten from body
    const newSettings: UserSettings = { 
      ...existingSettings, 
      ...updates,
      userId: existingSettings.userId // Keep original userId
    }; 
    
    // Basic validation example (can be expanded with a schema validator like Zod)
    if (updates.theme && !['light', 'dark'].includes(updates.theme)) {
        return res.status(400).json({ message: 'Invalid theme value.' });
    }

    const updatedSettings = await upsertItem<UserSettings>(SETTINGS_DB_FILE, userId, newSettings);
    res.status(200).json(updatedSettings);
  } catch (error) {
    console.error(`Error updating settings for user ${userId}:`, error);
    res.status(500).json({ message: 'Failed to update user settings.' });
  }
};
