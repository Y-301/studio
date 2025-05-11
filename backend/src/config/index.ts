
import dotenv from 'dotenv';
import path from 'path';

// Load .env file from the backend directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  port: process.env.BACKEND_PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  // Add other environment variables here
  // Example: apiKey: process.env.INTERNAL_API_KEY,
};

export default config;
