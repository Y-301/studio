
import express, { Request, Response } from 'express';

const app = express();
const port = process.env.BACKEND_PORT || 3001; // You can change this port

app.use(express.json());

// Basic route to check if the server is running
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'Backend is healthy and running!' });
});

// Placeholder for user routes (can be expanded later)
// Example: app.use('/api/users', require('./routes/userRoutes'));

// Placeholder for device routes
// Example: app.use('/api/devices', require('./routes/deviceRoutes'));

// Placeholder for routine routes
// Example: app.use('/api/routines', require('./routes/routineRoutes'));


app.listen(port, () => {
  console.log(`WakeSync backend server listening on port ${port}`);
});

export default app; // Optional: export for testing or other uses
