
// backend/src/server.ts
import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import config from './config'; 
import mainRouter from './routes'; 
import authRoutes from './routes/authRoutes'; // Import auth routes
import dataRoutes from './routes/dataRoutes'; // Import data routes
import { initializeScheduler, clearAllScheduledCronTasks, getScheduledTasksStatus } from './services/schedulerService'; 
import * as deviceService from './services/deviceService'; 
import * as wristbandService from './services/wristbandService'; 
import { log } from './services/logService'; 
import { initializeAppStatusFile } from './services/dataManagementService';


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
app.use(cors({
  origin: ['http://localhost:9002', 'http://localhost:3000'], // Add your frontend URL
  credentials: true,
}));
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

// Log requests (simple logger)
app.use((req: Request, res: Response, next: NextFunction) => {
  log('debug', `${req.method} ${req.url}`, undefined, { component: 'RequestLogger', ip: req.ip });
  next();
});

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// API Routes
app.use('/api/auth', authRoutes); // Mount auth routes
app.use('/api/data', dataRoutes); // Mount data routes for CSV & status
app.use('/api', mainRouter); // Mount other main API routes (devices, routines, etc.)


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
      cronTasksStatus: getScheduledTasksStatus(), 
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
initializeAppStatusFile().then(() => {
  log('info', 'App status file initialized/checked.', undefined, {component: 'ServerStartup'});
}).catch(err => {
  log('error', 'Failed to initialize app status file.', undefined, {component: 'ServerStartup', error: err});
});

initializeScheduler(); 
log('info', 'Scheduler initialized.', undefined, {component: 'ServerStartup'});

// Start Data Simulation
const runDeviceSimulation = enableDeviceSimulation && !config.isProduction;
const runWristbandSimulation = enableWristbandSimulation && !config.isProduction;

if (runDeviceSimulation) {
  log('info', `Device data simulation starting for user ${simulatedUserId}. Interval: ${deviceSimulationIntervalMs / 1000}s.`, undefined, {component: 'ServerStartup'});
  setInterval(async () => {
    try {
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

const gracefulShutdown = (signal: string) => {
  log('info', `${signal} signal received: closing HTTP server`, undefined, { component: 'ServerShutdown' });
  clearAllScheduledCronTasks(); 
  server.close(() => {
    log('info', 'HTTP server closed', undefined, { component: 'ServerShutdown' });
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
