
export interface UserSettings {
  userId: string;
  theme: 'light' | 'dark';
  notifications: {
    email: boolean;
    push: boolean;
  };
  timezone: string;
  // Add other settings properties as needed
}

// Default settings for a new user
export const getDefaultUserSettings = (userId: string): UserSettings => ({
  userId,
  theme: 'dark', // Default to dark theme
  notifications: {
    email: true,
    push: true,
  },
  timezone: 'UTC', // Default timezone
});
