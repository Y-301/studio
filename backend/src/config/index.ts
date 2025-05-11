
import dotenv from 'dotenv';
import path from 'path';

// Load .env file from the backend directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  port: process.env.BACKEND_PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development', // 'development', 'production', or 'test'
  // Add other environment variables here
  // Example: apiKey: process.env.INTERNAL_API_KEY,

  // Example of environment-specific setting
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',

  // Simulation settings (can be overridden by .env variables if desired)
  simulation: {
    userId: process.env.SIMULATION_USER_ID || 'user1',
    deviceIntervalMs: parseInt(process.env.SIMULATION_DEVICE_INTERVAL_MS || '15000', 10),
    wristbandIntervalMs: parseInt(process.env.SIMULATION_WRISTBAND_INTERVAL_MS || '5000', 10),
    enableDeviceSimulation: (process.env.ENABLE_DEVICE_SIMULATION || 'true') === 'true',
    enableWristbandSimulation: (process.env.ENABLE_WRISTBAND_SIMULATION || 'true') === 'true',
  }
};

export default config;
