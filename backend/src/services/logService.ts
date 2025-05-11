
// backend/services/logService.ts

// Basic log levels
export type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'success'; // Added success

// Basic Log entry structure
export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  userId?: string; // Optional: user associated with the log
  component?: string; // Optional: backend component where log originated
  details?: any; // Optional: additional details about the log (e.g., error stack, request body)
}

/**
 * Logs a message.
 * Currently logs to console, but can be extended to log to file, database, or external service.
 * @param level - The log level.
 * @param message - The log message.
 * @param userId - Optional user ID.
 * @param details - Optional additional details or component.
 */
export const log = async (
  level: LogLevel,
  message: string,
  userId?: string,
  details?: any
): Promise<void> => {
  const logEntry: LogEntry = {
    timestamp: new Date(),
    level,
    message,
    userId,
    details, // If details object contains component, it will be logged
  };

  // Simple console logging for now
  const logOutput = `[${logEntry.timestamp.toISOString()}] [${logEntry.level.toUpperCase()}]${logEntry.userId ? ` [User: ${logEntry.userId}]` : ''}${logEntry.component ? ` [${logEntry.component}]` : ''}: ${logEntry.message}`;
  
  switch (level) {
    case 'error':
      console.error(logOutput);
      if (details && details.stack) console.error(details.stack);
      else if (details) console.error('Details:', JSON.stringify(details, null, 2));
      break;
    case 'warn':
      console.warn(logOutput);
      if (details) console.warn('Details:', JSON.stringify(details, null, 2));
      break;
    case 'info':
    case 'success':
      console.info(logOutput); // Use console.info for info and success
      if (details) console.info('Details:', JSON.stringify(details, null, 2));
      break;
    case 'debug':
      // Only log debug messages if NODE_ENV is development (or a specific DEBUG flag is set)
      if (process.env.NODE_ENV === 'development') {
        console.debug(logOutput);
        if (details) console.debug('Details:', JSON.stringify(details, null, 2));
      }
      break;
    default:
      console.log(logOutput);
      if (details) console.log('Details:', JSON.stringify(details, null, 2));
  }

  // TODO: Implement actual logging mechanism if needed beyond console
  // - winston.log(level, message, { userId, details }); // Using a logging library
  // - await db.collection('logs').insertOne(logEntry); // Storing in a database
};

// Placeholder for getRecentLogs - not implemented in this pass, but could be
export const getRecentLogs = async (limit: number = 20, level?: LogLevel, userId?: string): Promise<LogEntry[]> => {
    // This would typically query from a persistent log store (DB, file, etc.)
    console.log(`[LogService] getRecentLogs called (limit: ${limit}, level: ${level}, userId: ${userId}) - currently returns mock data.`);
    return [
        { timestamp: new Date(), level: 'info', message: 'Mock log entry 1.', component: 'MockService' },
        { timestamp: new Date(), level: 'warn', message: 'Mock warning log.', component: 'MockService' },
    ];
}

// Placeholder for submitLogEntry from frontend/client if needed
export const submitLogEntry = async (logEntry: Omit<LogEntry, 'timestamp'>): Promise<void> => {
    // This would be an endpoint for clients to submit logs
    const entryToSave: LogEntry = {
        ...logEntry,
        timestamp: new Date(), // Server sets the timestamp
    };
    console.log(`[LogService] Received client log to submit: ${logEntry.message}`);
    // Save entryToSave to persistent store
    await log(entryToSave.level, `Client Log: ${entryToSave.message}`, entryToSave.userId, entryToSave.details);
}
