
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
    // If details is an object and contains 'component', use it, otherwise if details itself is a string, assume it's the component
    component: typeof details === 'object' && details !== null && 'component' in details ? details.component : (typeof details === 'string' ? details : undefined),
    details: typeof details === 'object' && details !== null ? details : undefined,
  };

  // Simple console logging for now
  const logOutput = `[${logEntry.timestamp.toISOString()}] [${logEntry.level.toUpperCase()}]${logEntry.userId ? ` [User: ${logEntry.userId}]` : ''}${logEntry.component ? ` [${logEntry.component}]` : ''}: ${logEntry.message}`;
  
  switch (level) {
    case 'error':
      console.error(logOutput);
      if (logEntry.details && logEntry.details.stack) console.error(logEntry.details.stack);
      else if (logEntry.details) console.error('Details:', JSON.stringify(logEntry.details, null, 2));
      break;
    case 'warn':
      console.warn(logOutput);
      if (logEntry.details) console.warn('Details:', JSON.stringify(logEntry.details, null, 2));
      break;
    case 'info':
    case 'success':
      console.info(logOutput); 
      if (logEntry.details) console.info('Details:', JSON.stringify(logEntry.details, null, 2));
      break;
    case 'debug':
      if (process.env.NODE_ENV === 'development') {
        console.debug(logOutput);
        if (logEntry.details) console.debug('Details:', JSON.stringify(logEntry.details, null, 2));
      }
      break;
    default:
      console.log(logOutput);
      if (logEntry.details) console.log('Details:', JSON.stringify(logEntry.details, null, 2));
  }

  // For actual logging beyond console, you would implement it here.
  // Example: winston.log(level, message, { userId, details });
  // Example: await db.collection('logs').insertOne(logEntry);
};

// In-memory store for mock logs (for demo purposes)
const mockLogStore: LogEntry[] = [];

/**
 * Gets recent log entries (from in-memory mock store for demo).
 * @param limit - Optional limit on the number of logs to retrieve.
 * @param levelFilter - Optional log level to filter by.
 * @param userIdFilter - Optional user ID to filter by.
 * @returns A promise that resolves with an array of log entries.
 */
export const getRecentLogs = async (limit: number = 20, levelFilter?: LogLevel, userIdFilter?: string): Promise<LogEntry[]> => {
    console.log(`[LogService] getRecentLogs called (limit: ${limit}, level: ${levelFilter}, userId: ${userIdFilter}) - returning mock data.`);
    
    let logs = [...mockLogStore]; // Work with a copy

    if (levelFilter) {
        logs = logs.filter(log => log.level === levelFilter);
    }
    if (userIdFilter) {
        logs = logs.filter(log => log.userId === userIdFilter);
    }
    // For demonstration, adding some static logs if the store is empty
    if (mockLogStore.length === 0) {
        return [
            { timestamp: new Date(Date.now() - 5000), level: 'info', message: 'Mock log entry: System Initialized.', component: 'MockService', userId: 'system' },
            { timestamp: new Date(Date.now() - 2000), level: 'warn', message: 'Mock warning: Low disk space simulation.', component: 'MockService', userId: 'system'},
        ].slice(0, limit);
    }
    return logs.slice(0, limit); // Return a slice of the store
}

/**
 * Submits a log entry, typically from a client or another service.
 * Stores it in the in-memory mock store for demo.
 * @param logEntryData - The log entry data, timestamp is optional and will be set by server if missing.
 */
export const submitLogEntry = async (logEntryData: Omit<LogEntry, 'timestamp'> & { timestamp?: Date | string }): Promise<void> => {
    const entryToSave: LogEntry = {
        ...logEntryData,
        timestamp: logEntryData.timestamp ? new Date(logEntryData.timestamp) : new Date(), // Server sets/ensures timestamp
    };
    console.log(`[LogService] Received client log to submit: ${entryToSave.message}`);
    
    // Store in the mockLogStore
    mockLogStore.unshift(entryToSave); // Add to the beginning for recent first
    if (mockLogStore.length > 200) { // Keep store size manageable
        mockLogStore.pop();
    }
    
    // Also log it via the main log function if desired (e.g., to console)
    // await log(entryToSave.level, `Client Log: ${entryToSave.message}`, entryToSave.userId, entryToSave.details);
}
