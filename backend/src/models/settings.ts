
export interface UserSettings {
  userId: string;
  theme: 'light' | 'dark' | 'system'; // Added 'system'
  notifications: {
    email: boolean;
    push: boolean;
  };
  timezone: string;
  createdAt: string; // ISO Date String
  updatedAt: string; // ISO Date String
  // Add other settings properties as needed
}

// Default settings for a new user
export const getDefaultUserSettings = (userId: string): UserSettings => {
  const now = new Date().toISOString();
  return {
    userId,
    theme: 'system', // Default to system theme
    notifications: {
      email: true,
      push: true,
    },
    timezone: 'UTC', // Default timezone
    createdAt: now,
    updatedAt: now,
  };
};
