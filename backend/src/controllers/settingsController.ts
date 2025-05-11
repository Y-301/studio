
import type { Request, Response } from 'express';
import { UserSettings, getDefaultUserSettings } from '../models/settings';
import { getItemById, upsertItem } from '../utils/jsonDb';
import { log } from '../services/logService';

const SETTINGS_DB_FILE = 'settings.json';

export const getUserSettings = async (req: Request, res: Response) => {
  const { userId } = req.params;
  if (!userId) {
    log('warn', 'User ID is required for getUserSettings.', undefined, { params: req.params });
    return res.status(400).json({ message: 'User ID is required.' });
  }

  try {
    let settings = await getItemById<UserSettings>(SETTINGS_DB_FILE, userId);
    if (!settings) {
      console.log(`No settings found for user ${userId}. Creating default settings.`);
      log('info', `No settings found for user ${userId}. Creating default settings.`, userId, { component: 'SettingsController' });
      settings = getDefaultUserSettings(userId);
      await upsertItem<UserSettings>(SETTINGS_DB_FILE, userId, settings); // Save default settings
    }
    res.status(200).json(settings);
  } catch (error) {
    console.error(`Error fetching settings for user ${userId}:`, error);
    log('error', `Error fetching settings for user ${userId}: ${(error as Error).message}`, userId, { component: 'SettingsController', stack: (error as Error).stack });
    res.status(500).json({ message: 'Failed to get user settings.' });
  }
};

export const updateUserSettings = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const updates = req.body as Partial<UserSettings>;

  if (!userId) {
    log('warn', 'User ID is required for updateUserSettings.', undefined, { params: req.params });
    return res.status(400).json({ message: 'User ID is required.' });
  }
  if (Object.keys(updates).length === 0) {
    log('warn', 'No settings provided to update for user.', userId, { body: req.body });
    return res.status(400).json({ message: 'No settings provided to update.' });
  }

  try {
    // Fetch existing settings or create default if they don't exist.
    // This ensures we're always merging with a complete settings object.
    let existingSettings = await getItemById<UserSettings>(SETTINGS_DB_FILE, userId);
    if (!existingSettings) {
        log('info', `No existing settings for user ${userId} during update. Initializing with defaults.`, userId, { component: 'SettingsController' });
        existingSettings = getDefaultUserSettings(userId);
    }
    
    // Merge updates with existing settings
    // Ensure userId from params is authoritative and not overwritten from body.
    const newSettings: UserSettings = { 
      ...existingSettings, 
      ...updates, // Apply updates from request body
      userId: userId, // Ensure userId is from URL param
      updatedAt: new Date().toISOString() // Add/update timestamp
    }; 
    
    // Basic validation example (can be expanded with a schema validator like Zod)
    if (updates.theme && !['light', 'dark', 'system'].includes(updates.theme)) { // Added 'system' as valid
        log('warn', `Invalid theme value: ${updates.theme}`, userId, { component: 'SettingsController' });
        return res.status(400).json({ message: 'Invalid theme value. Must be light, dark, or system.' });
    }
    if (updates.notifications) {
        if (typeof updates.notifications.email !== 'boolean' && updates.notifications.email !== undefined) {
            return res.status(400).json({message: 'Invalid email notification setting.'});
        }
         if (typeof updates.notifications.push !== 'boolean' && updates.notifications.push !== undefined) {
            return res.status(400).json({message: 'Invalid push notification setting.'});
        }
    }


    const updatedSettings = await upsertItem<UserSettings>(SETTINGS_DB_FILE, userId, newSettings);
    log('info', `User settings updated successfully for ${userId}`, userId, { component: 'SettingsController', updates: Object.keys(updates) });
    res.status(200).json(updatedSettings);
  } catch (error) {
    console.error(`Error updating settings for user ${userId}:`, error);
    log('error', `Error updating settings for user ${userId}: ${(error as Error).message}`, userId, { component: 'SettingsController', stack: (error as Error).stack });
    res.status(500).json({ message: 'Failed to update user settings.' });
  }
};
