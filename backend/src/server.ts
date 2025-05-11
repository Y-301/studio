// backend/src/server.ts
import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import config from './config'; 
import mainRouter from './routes'; 
import { initializeScheduler, clearAllScheduledCronTasks } from './services/schedulerService'; 
import * as deviceService from './services/deviceService'; 
import * as wristbandService from './services/wristbandService'; 
import { log } from './services/logService'; 

const app = express();

// --- Simulation Configuration ---
const SIMULATION_USER_ID = 'user1'; // Default user for simulations
const DEVICE_SIMULATION_INTERVAL_MS = 15000; // Simulate device changes every 15 seconds
const WRISTBAND_SIMULATION_INTERVAL_MS = 5000; // Simulate wristband data every 5 seconds
const ENABLE_DEVICE_SIMULATION = true; // Toggle device simulation
const ENABLE_WRISTBAND_SIMULATION = true; // Toggle wristband simulation
// --- End Simulation Configuration ---


// Middleware
app.use(cors()); 
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

// Log requests (simple logger)
app.use((req: Request, res: Response, next: NextFunction) => {
  log('debug', `${req.method} ${req.url}`, undefined, { component: 'RequestLogger', ip: req.ip });
  next();
});

// API Routes
app.use('/api', mainRouter); 

// Root route
app.get('/', (req: Request, res: Response) => {
  res.send('WakeSync Backend is alive and pulsating with simulated data!');
});

// Error Handling Middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  log('error', `Unhandled error: ${err.message}`, undefined, { component: 'GlobalErrorHandler', stack: err.stack, path: req.path });
  res.status(500).json({ message: 'Something went wrong on the server!' });
});


// Initialize services that need to run on startup
initializeScheduler(); 
log('info', 'Scheduler initialized.', undefined, {component: 'ServerStartup'});

// Start Data Simulation
if (ENABLE_DEVICE_SIMULATION && process.env.NODE_ENV !== 'test') {
  setInterval(async () => {
    try {
      log('debug', `Triggering device simulation for user ${SIMULATION_USER_ID}`, SIMULATION_USER_ID, {component: 'ServerSimulationLoop'});
      await deviceService.simulateDeviceChanges(SIMULATION_USER_ID);
    } catch (err) {
      log('error', 'Error in device simulation interval', SIMULATION_USER_ID, { error: (err as Error).message, stack: (err as Error).stack, component: 'ServerSimulationLoop' });
    }
  }, DEVICE_SIMULATION_INTERVAL_MS);
  log('info', `Device data simulation started for user ${SIMULATION_USER_ID}. Interval: ${DEVICE_SIMULATION_INTERVAL_MS / 1000}s.`, undefined, {component: 'ServerStartup'});
} else {
  log('info', `Device data simulation is ${ENABLE_DEVICE_SIMULATION ? 'DISABLED (test environment)' : 'DISABLED (config)'}.`, undefined, {component: 'ServerStartup'});
}


if (ENABLE_WRISTBAND_SIMULATION && process.env.NODE_ENV !== 'test') {
  setInterval(async () => {
    try {
      log('debug', `Triggering wristband simulation for user ${SIMULATION_USER_ID}`, SIMULATION_USER_ID, {component: 'ServerSimulationLoop'});
      await wristbandService.simulateAndProcessWristbandData(SIMULATION_USER_ID);
    } catch (err) {
      log('error', 'Error in wristband simulation interval', SIMULATION_USER_ID, { error: (err as Error).message, stack: (err as Error).stack, component: 'ServerSimulationLoop' });
    }
  }, WRISTBAND_SIMULATION_INTERVAL_MS);
  log('info', `Wristband data simulation started for user ${SIMULATION_USER_ID}. Interval: ${WRISTBAND_SIMULATION_INTERVAL_MS / 1000}s.`, undefined, {component: 'ServerStartup'});
} else {
   log('info', `Wristband data simulation is ${ENABLE_WRISTBAND_SIMULATION ? 'DISABLED (test environment)' : 'DISABLED (config)'}.`, undefined, {component: 'ServerStartup'});
}


const server = app.listen(config.port, () => {
  log('success', `WakeSync backend server running on http://localhost:${config.port}`, undefined, {component: 'ServerStartup', environment: config.nodeEnv});
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  log('info', 'SIGTERM signal received: closing HTTP server', undefined, { component: 'ServerShutdown' });
  clearAllScheduledCronTasks(); // Clear cron jobs
  server.close(() => {
    log('info', 'HTTP server closed', undefined, { component: 'ServerShutdown' });
    // Add any other cleanup here (e.g. database connections)
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  log('info', 'SIGINT signal received: closing HTTP server', undefined, { component: 'ServerShutdown' });
  clearAllScheduledCronTasks(); // Clear cron jobs
  server.close(() => {
    log('info', 'HTTP server closed', undefined, { component: 'ServerShutdown' });
    process.exit(0);
  });
});

export default app;