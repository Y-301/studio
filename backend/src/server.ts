
import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import config from './config'; // Loads .env automatically
import mainRouter from './routes'; // Main router from routes/index.ts
import { initializeScheduler } from './services/schedulerService'; // Scheduler

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

app.listen(config.port, () => {
  console.log(`WakeSync backend server running on http://localhost:${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
});

export default app;
