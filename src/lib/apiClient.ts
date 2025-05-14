// src/lib/apiClient.ts
import { auth, type User } from './firebase';
import { mockUserStore } from './mockAuthStore'; // Import from the new store file

// Import mock data
import initialMockUser1Devices from './mock-data/devices.json';
import initialMockUser1Routines from './mock-data/routines.json';
import initialMockUser1FloorPlanRoot from './mock-data/floorplan.json';

const initialMockUser1FloorPlan = (initialMockUser1FloorPlanRoot as any).user1 || initialMockUser1FloorPlanRoot;

import initialMockDashboardSummaryData from './mock-data/dashboardSummary.json';
import initialMockUser1SettingsRoot from './mock-data/settings.json';

const initialMockUser1Settings = (initialMockUser1SettingsRoot as any).user1 || initialMockUser1SettingsRoot;

import initialMockAnalyticsSummaryData from './mock-data/analyticsSummary.json';
import initialMockSimulationHistoryData from './mock-data/simulationHistory.json';
import initialMockWristbandEventsData from './mock-data/wristbandEvents.json';
import initialMockLogsData from './mock-data/logs.json';

// For stateful mocks (especially routines, devices, etc.)
let currentMockUser1Routines = JSON.parse(JSON.stringify(initialMockUser1Routines));
let currentMockUser1Devices = JSON.parse(JSON.stringify(initialMockUser1Devices));
let currentMockUser1FloorPlan = JSON.parse(JSON.stringify(initialMockUser1FloorPlan));
let currentMockUser1Settings = JSON.parse(JSON.stringify(initialMockUser1Settings));

// New mock state for app status
let currentMockStatus = {
  isSeededByCsv: false,
};


const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001/api';

async function getAuthHeaders() {
  const user = auth.currentUser as User | null;
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (user && user.uid !== 'guest-user') { // Ensure guest user doesn't try to get a token
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('wakeSyncToken') : null; // Get token from localStorage
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      // Always include X-User-ID if user is available, for backend identification
      if (user.uid) {
        headers['X-User-ID'] = user.uid;
      }
    } catch (error) {
      console.error("Error preparing auth headers:", error);
      if (user && user.uid) { // Fallback for user.uid if token retrieval failed
          headers['X-User-ID'] = user.uid;
      }
    }
  } else if (process.env.NEXT_PUBLIC_USE_MOCK_MODE === 'true' && (!user || user.uid === 'guest-user')) {
    // This header is specific to the local backend's expectation for a default mock user if no auth.
    // Ensure your backend handles this 'user1' if it expects it for unauthenticated mock scenarios.
    headers['X-User-ID'] = 'user1';
  }
  return headers;
}

export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const isMockMode = process.env.NEXT_PUBLIC_USE_MOCK_MODE === 'true';

  if (isMockMode && (options.method === 'GET' || !options.method)) {
    console.log(`[Mock API Client] GET ${endpoint}`);
    if (endpoint === '/devices') {
      return Promise.resolve(currentMockUser1Devices.filter((d: any) => d.userId === 'user1') as T);
    }
    if (endpoint === '/routines') {
      return Promise.resolve(currentMockUser1Routines.filter((r: any) => r.userId === 'user1') as T);
    }
    if (endpoint === '/simulation/floorplan') {
      return Promise.resolve(currentMockUser1FloorPlan as T);
    }
    if (endpoint.startsWith('/dashboard/summary')) {
      const summaryData = {
        ...initialMockDashboardSummaryData,
        totalDevices: currentMockUser1Devices.filter((d:any) => d.userId === 'user1').length,
        activeDevices: currentMockUser1Devices.filter((d:any) => d.userId === 'user1' && (d.status?.toLowerCase() === 'on' || (d.type === 'thermostat' && parseInt(d.status) > 0))).length,
        totalRoutines: currentMockUser1Routines.filter((r:any) => r.userId === 'user1').length,
        activeRoutines: currentMockUser1Routines.filter((r:any) => r.userId === 'user1' && r.isEnabled).length,
      };
      return Promise.resolve(summaryData as T);
    }
    if (endpoint === ('/settings/user1')) { // Assuming user1 for mock settings
        return Promise.resolve(currentMockUser1Settings as T);
    }
    if (endpoint.startsWith('/analytics/summary')) {
       return Promise.resolve(initialMockAnalyticsSummaryData as T);
     }
     if (endpoint.startsWith('/simulations/history')) {
       return Promise.resolve(initialMockSimulationHistoryData as T);
     }
      if (endpoint.startsWith('/wristband/events')) {
        return Promise.resolve(initialMockWristbandEventsData as T);
      }
       if (endpoint.startsWith('/logs')) {
         return Promise.resolve(initialMockLogsData as T);
       }
       if (endpoint === '/data/app-status') {
        const hasMockUsers = Object.keys(mockUserStore).length > 0;
        console.log(`[Mock API Client] /data/app-status returning: isSeededByCsv=${currentMockStatus.isSeededByCsv}, hasUsers=${hasMockUsers}`);
        return Promise.resolve({ isSeededByCsv: currentMockStatus.isSeededByCsv, hasUsers: hasMockUsers } as T);
      }


    console.warn(`[Mock API Client] No specific mock handler for GET ${endpoint}. Returning empty object/array.`);
    if (endpoint.includes("[]") || endpoint.endsWith("s") || endpoint.includes("history") || endpoint.includes("events") || endpoint.includes("logs")) {
        return Promise.resolve([] as T);
    }
    return Promise.resolve({} as T);
  }

  if (isMockMode && (options.method === 'POST' || options.method === 'PUT' || options.method === 'DELETE')) {
    console.log(`[Mock API Client] ${options.method} ${endpoint} - Simulating success.`);
    let mockResponseData: any = { message: `${options.method} successful (mock)` };

    const requestBody = options.body && typeof options.body === 'string' ? JSON.parse(options.body) : {};


    if (options.method === 'POST' && endpoint === '/devices') {
        const newDevice = { ...requestBody, id: `mock-device-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), userId: 'user1' };
        currentMockUser1Devices.push(newDevice);
        mockResponseData = newDevice;
    } else if (options.method === 'PUT' && endpoint.startsWith('/devices/')) {
        const deviceId = endpoint.split('/').pop();
        const deviceIndex = currentMockUser1Devices.findIndex((d: any) => d.id === deviceId);
        if (deviceIndex > -1) {
            currentMockUser1Devices[deviceIndex] = { ...currentMockUser1Devices[deviceIndex], ...requestBody, updatedAt: new Date().toISOString() };
            mockResponseData = currentMockUser1Devices[deviceIndex];
        } else {
            mockResponseData = { message: "Device not found for update (mock)", error: true };
        }
    } else if (options.method === 'POST' && endpoint.match(/\/devices\/[^/]+\/control/)) {
        const deviceId = endpoint.split('/')[2];
        const deviceIndex = currentMockUser1Devices.findIndex((d: any) => d.id === deviceId);
        if (deviceIndex > -1) {
            const existingDevice = currentMockUser1Devices[deviceIndex];
            const newStatus = requestBody.status !== undefined ? requestBody.status : existingDevice.status;
            const newSettings = requestBody.settings ? { ...existingDevice.settings, ...requestBody.settings } : existingDevice.settings;
            
            currentMockUser1Devices[deviceIndex] = { ...existingDevice, status: newStatus, settings: newSettings, updatedAt: new Date().toISOString() };
            mockResponseData = currentMockUser1Devices[deviceIndex];
        } else {
             mockResponseData = { message: `Mock device ${deviceId} not found for control`, error: true};
        }
    } else if (options.method === 'POST' && endpoint === '/routines') {
        const newRoutine = {
            ...requestBody,
            id: `mock-routine-${Date.now()}`,
            userId: 'user1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastRun: null,
        };
        currentMockUser1Routines.push(newRoutine);
        mockResponseData = newRoutine;
    } else if (options.method === 'PUT' && endpoint.startsWith('/routines/')) {
        const routineId = endpoint.split('/').pop();
        const routineIndex = currentMockUser1Routines.findIndex((r: any) => r.id === routineId);
        if (routineIndex > -1) {
            currentMockUser1Routines[routineIndex] = { ...currentMockUser1Routines[routineIndex], ...requestBody, updatedAt: new Date().toISOString() };
            mockResponseData = currentMockUser1Routines[routineIndex];
        } else {
            mockResponseData = { message: "Routine not found for update (mock)", error: true };
        }
    } else if (options.method === 'DELETE' && endpoint.startsWith('/routines/')) {
        const routineId = endpoint.split('/').pop();
        const initialLength = currentMockUser1Routines.length;
        currentMockUser1Routines = currentMockUser1Routines.filter((r: any) => r.id !== routineId);
        if (currentMockUser1Routines.length < initialLength) {
            mockResponseData = { message: `Routine ${routineId} deleted (mock)` };
        } else {
            mockResponseData = { message: `Routine ${routineId} not found for deletion (mock)`, error: true };
        }
    } else if (options.method === 'POST' && endpoint.match(/\/routines\/[^/]+\/trigger/)) {
        const routineId = endpoint.split('/')[2];
        const routineIndex = currentMockUser1Routines.findIndex((r: any) => r.id === routineId);
        if (routineIndex > -1) {
            currentMockUser1Routines[routineIndex].lastRun = new Date().toISOString();
             mockResponseData = { message: `Routine ${currentMockUser1Routines[routineIndex].name} triggered successfully (mock)`};
        } else {
            mockResponseData = { message: `Routine ${routineId} not found for trigger (mock)`, error: true};
        }
    } else if (options.method === 'POST' && endpoint === '/simulation/floorplan') {
        currentMockUser1FloorPlan = { ...requestBody, userId: 'user1' }; 
        mockResponseData = { message: "Floor plan saved (mock)", data: currentMockUser1FloorPlan };
    } else if (options.method === 'PUT' && endpoint.startsWith('/settings/user1')) { 
        currentMockUser1Settings.theme = requestBody.theme ?? currentMockUser1Settings.theme;
        currentMockUser1Settings.notifications = requestBody.notifications ?? currentMockUser1Settings.notifications;
        currentMockUser1Settings.timezone = requestBody.timezone ?? currentMockUser1Settings.timezone;
        (currentMockUser1Settings as any).updatedAt = new Date().toISOString(); // Type assertion if updatedAt is not on the base type
        mockResponseData = { ...currentMockUser1Settings };
    } else if (options.method === 'POST' && endpoint === '/data/upload-csv/devices') {
        console.log("[Mock API Client] Simulating CSV upload for devices. Request body:", requestBody);
        currentMockStatus.isSeededByCsv = true;
        mockResponseData = { message: "CSV for devices processed and data updated (mock).", importedCount: requestBody.mockDeviceCount || 5 };
    }
    // Note: Auth endpoints (/auth/login, /auth/signup, etc.) are handled by src/lib/firebase.ts's mock auth object,
    // which then calls the actual backend if USE_MOCK_MODE=false, or uses its internal mock store if USE_MOCK_MODE=true.
    // This apiClient is for general data endpoints.

    return Promise.resolve(mockResponseData as T);
  }


  // If not mock mode, proceed with actual fetch
  const dynamicHeaders = await getAuthHeaders();
  const requestHeaders: HeadersInit = {
    ...dynamicHeaders,
    ...options.headers,
  };

  let finalBody = options.body;
  if (options.body instanceof FormData) {
    // For FormData, let the browser set the Content-Type header correctly with boundary
    delete requestHeaders['Content-Type'];
  } else if (options.body && typeof options.body === 'object') {
    // Ensure other objects are stringified if not FormData
    finalBody = JSON.stringify(options.body);
    // Ensure Content-Type is application/json if not already set and not FormData
    if (!requestHeaders['Content-Type']) {
        requestHeaders['Content-Type'] = 'application/json';
    }
  }


  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: requestHeaders,
    body: finalBody,
  });

  if (!response.ok) {
    let errorData;
    const errorContentType = response.headers.get("content-type");
    if (errorContentType && errorContentType.indexOf("application/json") !== -1) {
        try {
            errorData = await response.json();
        } catch (e) {
            errorData = { message: response.statusText || 'API request failed with non-JSON error body', status: response.status };
        }
    } else {
        try {
            const textError = await response.text();
            errorData = { message: textError || response.statusText || 'API request failed with non-JSON error body', status: response.status };
        } catch (e) {
             errorData = { message: response.statusText || 'API request failed and could not parse error body', status: response.status };
        }
    }
    console.error('API Error Response:', errorData, 'Status:', response.status, 'Endpoint:', endpoint);
    const errorToThrow = new Error(errorData.message || `API request failed: ${response.status}`);
    (errorToThrow as any).status = response.status; 
    throw errorToThrow;
  }

  if (response.status === 204) { 
    return null as T;
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.indexOf("application/json") !== -1) {
    return response.json() as Promise<T>;
  } else {
    try {
        const textResponse = await response.text();
        if(textResponse) {
            console.warn(`Received non-JSON response from ${endpoint}. Attempting to return as text. Content: ${textResponse}`);
            return textResponse as unknown as T; 
        }
    } catch (e) {
       // Fall through
    }
    console.warn(`Received non-JSON or empty successful response from ${endpoint}. Content-Type: ${contentType}. Returning null.`);
    return null as T;
  }
}
