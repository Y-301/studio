// src/app/api/logs/submit/route.ts
import { NextResponse } from 'next/server';
import { submitLogEntry, type LogEntry, type LogLevel } from '@/backend/services/logService'; 

// POST /api/logs/submit - Receive and submit a log entry
export async function POST(request: Request) {
  try {
    // NOTE: This endpoint might not require user authentication if it's for collecting
    // logs from unauthenticated clients or specific devices. Authorization might
    // involve an API key or other form of credential if necessary.
    // Implement authorization here if needed.

    const rawLogEntry: Partial<LogEntry> = await request.json();
    console.log('Received log entry:', rawLogEntry);

     // Basic validation example
     if (!rawLogEntry.level || !rawLogEntry.message) {
         return NextResponse.json({ error: 'Missing required log entry data: level and message are required.' }, { status: 400 });
     }
      const validLevels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'success'];
      if (!validLevels.includes(rawLogEntry.level)) {
          return NextResponse.json({ error: `Invalid log level. Must be one of: ${validLevels.join(', ')}` }, { status: 400 });
      }

     // Construct the final log entry, ensuring server-set timestamp if not provided or to override
     const logEntryToSubmit: Omit<LogEntry, 'timestamp'> & { timestamp?: Date | string } = {
        level: rawLogEntry.level,
        message: rawLogEntry.message,
        userId: rawLogEntry.userId,
        component: rawLogEntry.component,
        details: rawLogEntry.details,
        // Allow client timestamp, but server can override or set if missing
        timestamp: rawLogEntry.timestamp ? new Date(rawLogEntry.timestamp) : undefined 
     };

    await submitLogEntry(logEntryToSubmit as Omit<LogEntry, 'timestamp'>); // submitLogEntry in service will handle final timestamp

    return NextResponse.json({ message: 'Log entry received' }, { status: 200 });

  } catch (error: any) {
    console.error('Error submitting log entry:', error);
    if (error instanceof SyntaxError) { // Handle JSON parsing errors
        return NextResponse.json({ error: 'Invalid JSON format in request body.' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Failed to submit log entry' }, { status: 500 });
  }
}
