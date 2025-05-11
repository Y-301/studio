
import dotenv from 'dotenv';
import path from 'path';

// Load .env file from the backend directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  port: process.env.BACKEND_PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development', // 'development', 'production', or 'test'
  
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',

  // Simulation settings
  simulation: {
    // User ID for which simulations will run.
    // In a multi-user environment, this would be managed differently or removed for global simulations.
    simulatedUserId: process.env.SIMULATION_USER_ID || 'user1', 
    
    // Interval in milliseconds for device state change simulation. Default: 15 seconds.
    deviceSimulationIntervalMs: parseInt(process.env.DEVICE_SIMULATION_INTERVAL_MS || '15000', 10),
    
    // Interval in milliseconds for wristband data simulation. Default: 5 seconds.
    wristbandSimulationIntervalMs: parseInt(process.env.WRISTBAND_SIMULATION_INTERVAL_MS || '5000', 10),
    
    // Global toggle for device state simulation. Default: true in development.
    enableDeviceSimulation: (process.env.ENABLE_DEVICE_SIMULATION || (process.env.NODE_ENV === 'development' ? 'true' : 'false')) === 'true',
    
    // Global toggle for wristband data simulation. Default: true in development.
    enableWristbandSimulation: (process.env.ENABLE_WRISTBAND_SIMULATION || (process.env.NODE_ENV === 'development' ? 'true' : 'false')) === 'true',
  }
};

export default config;

