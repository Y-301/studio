// src/app/api/logs/submit/route.ts
import { NextResponse } from 'next/server';
import { submitLogEntry, LogEntry } from '@/backend/services/logService'; // Assuming this exists

// POST /api/logs/submit - Receive and submit a log entry
export async function POST(request: Request) {
  try {
    // NOTE: This endpoint might not require user authentication if it's for collecting
    // logs from unauthenticated clients or specific devices. Authorization might
    // involve an API key or other form of credential if necessary.
    // Implement authorization here if needed.

    const logEntry: LogEntry = await request.json();
    console.log('Received log entry:', logEntry);

    // TODO: Add input validation for incoming logEntry
    // Ensure required fields like level, message, timestamp are present
    // Validate the format and type of fields

     // Convert timestamp string to Date object if needed
     if (typeof logEntry.timestamp === 'string') {
        logEntry.timestamp = new Date(logEntry.timestamp);
     }

     // Basic validation example
     if (!logEntry.level || !logEntry.message || !logEntry.timestamp) {
         return NextResponse.json({ error: 'Missing required log entry data' }, { status: 400 });
     }
      // Validate log level against your expected levels
      // if (!['debug', 'info', 'warn', 'error', 'fatal'].includes(logEntry.level)) {
      //     return NextResponse.json({ error: 'Invalid log level' }, { status: 400 });
      // }


    await submitLogEntry(logEntry); // Your function to process/store the log entry

    // Respond quickly to the sender
    return NextResponse.json({ message: 'Log entry received' }, { status: 200 });

  } catch (error: any) {
    console.error('Error submitting log entry:', error);
    // Respond with an error status if processing failed
    return NextResponse.json({ error: error.message || 'Failed to submit log entry' }, { status: 500 });
  }
}
