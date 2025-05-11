
export interface UserSettings {
  userId: string;
  theme: 'light' | 'dark' | 'system'; 
  notifications: {
    email: boolean;
    push: boolean;
  };
  timezone: string; // e.g., "America/New_York", "Europe/London"
  // defaultWakeUpSound?: string; // Optional, if stored in backend
  createdAt: string; // ISO Date String
  updatedAt: string; // ISO Date String
}

// Default settings for a new user
export const getDefaultUserSettings = (userId: string): UserSettings => {
  const now = new Date().toISOString();
  return {
    userId,
    theme: 'system', 
    notifications: {
      email: true,
      push: true,
    },
    timezone: 'UTC', // Default timezone
    // defaultWakeUpSound: 'nature_sounds',
    createdAt: now,
    updatedAt: now,
  };
};
