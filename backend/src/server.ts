
import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import config from './config'; // Loads .env automatically
import mainRouter from './routes'; // Main router from routes/index.ts
import { initializeScheduler } from './services/schedulerService'; // Scheduler
import * as deviceService from './services/deviceService'; // For device data simulation
import * as wristbandService from './services/wristbandService'; // For wristband data simulation
import { log } from './services/logService'; // For logging simulation startup

const app = express();

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies

// Log requests (simple logger)
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use('/api', mainRouter); // Mount main router under /api prefix

// Root route (optional, for simple server check)
app.get('/', (req: Request, res: Response) => {
  res.send('WakeSync Backend is alive!');
});

// Error Handling Middleware (simple example)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ message: 'Something went wrong on the server!' });
});

// Initialize services that need to run on startup
initializeScheduler(); // Load and schedule routines

// Start Data Simulation
const SIMULATION_USER_ID = 'user1'; // Default user for simulations
const DEVICE_SIMULATION_INTERVAL = 15000; // Simulate device changes every 15 seconds
const WRISTBAND_SIMULATION_INTERVAL = 5000; // Simulate wristband data every 5 seconds

setInterval(() => {
  if (process.env.NODE_ENV !== 'test') { // Avoid simulation during tests
    deviceService.simulateDeviceChanges(SIMULATION_USER_ID)
      .catch(err => log('error', 'Error in device simulation interval', SIMULATION_USER_ID, { error: err.message, component: 'ServerSimulation' }));
  }
}, DEVICE_SIMULATION_INTERVAL);
log('info', `Device data simulation started for user ${SIMULATION_USER_ID}. Interval: ${DEVICE_SIMULATION_INTERVAL / 1000}s.`, undefined, {component: 'ServerSimulation'});


setInterval(() => {
  if (process.env.NODE_ENV !== 'test') { // Avoid simulation during tests
    wristbandService.simulateAndProcessWristbandData(SIMULATION_USER_ID)
      .catch(err => log('error', 'Error in wristband simulation interval', SIMULATION_USER_ID, { error: err.message, component: 'ServerSimulation' }));
  }
}, WRISTBAND_SIMULATION_INTERVAL);
log('info', `Wristband data simulation started for user ${SIMULATION_USER_ID}. Interval: ${WRISTBAND_SIMULATION_INTERVAL / 1000}s.`, undefined, {component: 'ServerSimulation'});


app.listen(config.port, () => {
  console.log(`WakeSync backend server running on http://localhost:${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
  log('info', `Server started on port ${config.port} in ${config.nodeEnv} mode.`, undefined, {component: 'ServerStartup'});
});

export default app;

