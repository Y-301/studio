
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

// --- Simulation Configuration (loaded from config.ts) ---
const {
  userId: SIMULATION_USER_ID,
  deviceIntervalMs: DEVICE_SIMULATION_INTERVAL_MS,
  wristbandIntervalMs: WRISTBAND_SIMULATION_INTERVAL_MS,
  enableDeviceSimulation: ENABLE_DEVICE_SIMULATION,
  enableWristbandSimulation: ENABLE_WRISTBAND_SIMULATION,
} = config.simulation;
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

// API Health Check / Status Endpoint
app.get('/status', (req: Request, res: Response) => {
  // Basic health check. Could be expanded to include DB status, simulation status etc.
  res.status(200).json({
    status: 'OK',
    message: 'WakeSync Backend is healthy.',
    timestamp: new Date().toISOString(),
    nodeEnv: config.nodeEnv,
    simulation: {
      deviceSimulation: ENABLE_DEVICE_SIMULATION ? 'enabled' : 'disabled',
      wristbandSimulation: ENABLE_WRISTBAND_SIMULATION ? 'enabled' : 'disabled',
      simulatingForUser: SIMULATION_USER_ID,
    }
  });
});


// Error Handling Middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  log('error', `Unhandled error: ${err.message}`, undefined, { component: 'GlobalErrorHandler', stack: err.stack, path: req.path });
  // Sanitize error message for production
  const errorMessage = config.isProduction ? 'An internal server error occurred.' : err.message;
  res.status(500).json({ message: 'Something went wrong on the server!', error: errorMessage });
});


// Initialize services that need to run on startup
initializeScheduler(); 
log('info', 'Scheduler initialized.', undefined, {component: 'ServerStartup'});

// Start Data Simulation
if (ENABLE_DEVICE_SIMULATION && !config.isProduction) { // Typically, don't run full simulations in prod
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
  log('info', `Device data simulation is ${ENABLE_DEVICE_SIMULATION ? (config.isProduction ? 'DISABLED (production env)' : 'ENABLED') : 'DISABLED (config)'}.`, undefined, {component: 'ServerStartup'});
}


if (ENABLE_WRISTBAND_SIMULATION && !config.isProduction) { // Typically, don't run full simulations in prod
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
   log('info', `Wristband data simulation is ${ENABLE_WRISTBAND_SIMULATION ? (config.isProduction ? 'DISABLED (production env)' : 'ENABLED') : 'DISABLED (config)'}.`, undefined, {component: 'ServerStartup'});
}


const server = app.listen(config.port, () => {
  log('success', `WakeSync backend server running on http://localhost:${config.port}`, undefined, {component: 'ServerStartup', environment: config.nodeEnv});
});

// Graceful Shutdown
const gracefulShutdown = (signal: string) => {
  log('info', `${signal} signal received: closing HTTP server`, undefined, { component: 'ServerShutdown' });
  clearAllScheduledCronTasks(); // Clear cron jobs
  server.close(() => {
    log('info', 'HTTP server closed', undefined, { component: 'ServerShutdown' });
    // Add any other cleanup here (e.g. database connections)
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
