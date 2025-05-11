// backend/src/services/settingsService.ts
import type { UserSettings, getDefaultUserSettings as getDefaultSettingsType } from '../models/settings'; // Assuming settings model exists
import {
  getItemById,
  upsertItem,
  readDbFile,
  writeDbFile
} from '../utils/jsonDb';
import { log } from './logService';
import { getDefaultUserSettings } from '../models/settings';


const SETTINGS_DB_FILE = 'settings.json'; // One file storing settings for all users, keyed by userId.

export const getUserSettings = async (userId: string): Promise<UserSettings> => {
  log('info', `Fetching settings for user: ${userId}`, userId, { component: 'SettingsService' });
  const allSettings = await readDbFile<{ [key: string]: UserSettings }>(SETTINGS_DB_FILE);
  let userSettings = allSettings[userId];

  if (!userSettings) {
    log('info', `No settings found for user ${userId}. Creating default settings.`, userId, { component: 'SettingsService' });
    userSettings = getDefaultUserSettings(userId);
    allSettings[userId] = userSettings;
    await writeDbFile(SETTINGS_DB_FILE, allSettings);
  }
  return userSettings;
};

export const updateUserSettings = async (userId: string, updates: Partial<Omit<UserSettings, 'userId' | 'createdAt' | 'updatedAt'>>): Promise<UserSettings | null> => {
  log('info', `Updating settings for user: ${userId}`, userId, { component: 'SettingsService', updatesCount: Object.keys(updates).length });
  
  const allSettings = await readDbFile<{ [key: string]: UserSettings }>(SETTINGS_DB_FILE);
  let existingSettings = allSettings[userId];

  if (!existingSettings) {
    log('warn', `No existing settings found for user ${userId} during update. Initializing with defaults before applying updates.`, userId, { component: 'SettingsService' });
    existingSettings = getDefaultUserSettings(userId);
  }

  const newSettings: UserSettings = {
    ...existingSettings,
    ...updates,
    userId: userId, // Ensure userId is correctly set
    updatedAt: new Date().toISOString(),
  };

  allSettings[userId] = newSettings;
  await writeDbFile(SETTINGS_DB_FILE, allSettings);
  
  log('info', `User settings updated successfully for ${userId}`, userId, { component: 'SettingsService' });
  return newSettings;
};
