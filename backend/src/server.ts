
// backend/src/server.ts
import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import config from './config'; 
import mainRouter from './routes'; 
import { initializeScheduler, clearAllScheduledCronTasks, getScheduledTasksStatus } from './services/schedulerService'; 
import * as deviceService from './services/deviceService'; 
import * as wristbandService from './services/wristbandService'; 
import { log } from './services/logService'; 

const app = express();

// --- Simulation Configuration (loaded from config.ts) ---
const {
  simulatedUserId,
  deviceSimulationIntervalMs,
  wristbandSimulationIntervalMs,
  enableDeviceSimulation,
  enableWristbandSimulation,
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
  res.status(200).json({
    status: 'OK',
    message: 'WakeSync Backend is healthy.',
    timestamp: new Date().toISOString(),
    nodeEnv: config.nodeEnv,
    simulation: {
      deviceSimulationActive: enableDeviceSimulation && !config.isProduction,
      wristbandSimulationActive: enableWristbandSimulation && !config.isProduction,
      simulatingForUser: simulatedUserId,
      deviceSimulationIntervalMs,
      wristbandSimulationIntervalMs,
    },
    scheduler: {
      cronTasksStatus: getScheduledTasksStatus(), // Get status from schedulerService
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
// Only run simulations in development mode by default, or if explicitly enabled and not in production.
const runDeviceSimulation = enableDeviceSimulation && !config.isProduction;
const runWristbandSimulation = enableWristbandSimulation && !config.isProduction;

if (runDeviceSimulation) {
  log('info', `Device data simulation starting for user ${simulatedUserId}. Interval: ${deviceSimulationIntervalMs / 1000}s.`, undefined, {component: 'ServerStartup'});
  setInterval(async () => {
    try {
      // log('debug', `Triggering device simulation for user ${simulatedUserId}`, simulatedUserId, {component: 'ServerSimulationLoop'});
      await deviceService.simulateDeviceChanges(simulatedUserId);
    } catch (err) {
      log('error', 'Error in device simulation interval', simulatedUserId, { error: (err as Error).message, stack: (err as Error).stack, component: 'ServerSimulationLoop' });
    }
  }, deviceSimulationIntervalMs);
} else {
  log('info', `Device data simulation is DISABLED. (Enabled: ${enableDeviceSimulation}, Production: ${config.isProduction})`, undefined, {component: 'ServerStartup'});
}


if (runWristbandSimulation) {
  log('info', `Wristband data simulation starting for user ${simulatedUserId}. Interval: ${wristbandSimulationIntervalMs / 1000}s.`, undefined, {component: 'ServerStartup'});
  setInterval(async () => {
    try {
      // log('debug', `Triggering wristband simulation for user ${simulatedUserId}`, simulatedUserId, {component: 'ServerSimulationLoop'});
      await wristbandService.simulateAndProcessWristbandData(simulatedUserId);
    } catch (err) {
      log('error', 'Error in wristband simulation interval', simulatedUserId, { error: (err as Error).message, stack: (err as Error).stack, component: 'ServerSimulationLoop' });
    }
  }, wristbandSimulationIntervalMs);
} else {
   log('info', `Wristband data simulation is DISABLED. (Enabled: ${enableWristbandSimulation}, Production: ${config.isProduction})`, undefined, {component: 'ServerStartup'});
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

