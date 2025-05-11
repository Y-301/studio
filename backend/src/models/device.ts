// backend/src/models/device.ts

export interface Device {
  id: string;
  userId: string; // Link to the user who owns the device
  name: string;
  type: 'light' | 'thermostat' | 'lock' | 'speaker' | 'blinds' | 'sensor' | 'tv' | 'fan' | 'switch' | 'other';
  status: string; // e.g., 'on', 'off', '22°C', '50% Open'
  settings: {
    brightness?: number;
    temperature?: number;
    volume?: number;
    color?: string;
    // Add other device-specific settings
    [key: string]: any; // Allow other dynamic settings
  };
  room?: string; // Optional: room the device is in
  icon?: React.ElementType; // For frontend rendering
  dataAiHint?: string; // For image generation hints
  connectionDetails?: string; // For storing IP, MAC, etc.
  createdAt: string; // ISO Date String
  updatedAt: string; // ISO Date String
}
