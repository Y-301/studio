
// src/lib/apiClient.ts
import { auth, type User } from './firebase';

// Import mock data
import initialMockUser1Devices from './mock-data/devices.json';
import initialMockUser1Routines from './mock-data/routines.json'; // Renamed to indicate it's the initial state
import initialMockUser1FloorPlanRoot from './mock-data/floorplan.json';
const initialMockUser1FloorPlan = (initialMockUser1FloorPlanRoot as any).user1;
import initialMockDashboardSummaryData from './mock-data/dashboardSummary.json';
import initialMockUser1SettingsRoot from './mock-data/settings.json';
const initialMockUser1Settings = (initialMockUser1SettingsRoot as any).user1;
import initialMockAnalyticsSummaryData from './mock-data/analyticsSummary.json';
import initialMockSimulationHistoryData from './mock-data/simulationHistory.json';
import initialMockWristbandEventsData from './mock-data/wristbandEvents.json';
import initialMockLogsData from './mock-data/logs.json';

// For stateful mocks (especially routines)
let currentMockUser1Routines = JSON.parse(JSON.stringify(initialMockUser1Routines));
let currentMockUser1Devices = JSON.parse(JSON.stringify(initialMockUser1Devices));
let currentMockUser1FloorPlan = JSON.parse(JSON.stringify(initialMockUser1FloorPlan));
let currentMockUser1Settings = JSON.parse(JSON.stringify(initialMockUser1Settings));


const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001/api';

async function getAuthHeaders() {
  const user = auth.currentUser as User | null;
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (user) {
    try {
      const token = await user.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
      headers['X-User-ID'] = user.uid;
    } catch (error) {
      console.error("Error getting ID token:", error);
      if (user.uid) {
          headers['X-User-ID'] = user.uid;
      }
    }
  } else if (process.env.NEXT_PUBLIC_USE_MOCK_MODE === 'true') {
    headers['X-User-ID'] = 'user1'; // Default mock user ID
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
      // For summary, potentially recalculate based on currentMockUser1Devices/Routines if needed
      const summaryData = {
        ...initialMockDashboardSummaryData,
        totalDevices: currentMockUser1Devices.filter((d:any) => d.userId === 'user1').length,
        activeDevices: currentMockUser1Devices.filter((d:any) => d.userId === 'user1' && (d.status?.toLowerCase() === 'on' || (d.type === 'thermostat' && parseInt(d.status) > 0))).length,
        totalRoutines: currentMockUser1Routines.filter((r:any) => r.userId === 'user1').length,
        activeRoutines: currentMockUser1Routines.filter((r:any) => r.userId === 'user1' && r.isEnabled).length,
      };
      return Promise.resolve(summaryData as T);
    }
    if (endpoint === ('/settings/user1')) {
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

    console.warn(`[Mock API Client] No specific mock handler for GET ${endpoint}. Returning empty object/array.`);
    return Promise.resolve((endpoint.includes('[]') ? [] : {}) as T);
  }

  if (isMockMode && (options.method === 'POST' || options.method === 'PUT' || options.method === 'DELETE')) {
    console.log(`[Mock API Client] ${options.method} ${endpoint} - Simulating success.`);
    let mockResponseData: any = { message: `${options.method} successful (mock)` };

    const requestBody = options.body ? JSON.parse(options.body as string) : {};

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
            mockResponseData = { message: "Device not found for update (mock)" };
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
             mockResponseData = { message: `Mock device ${deviceId} not found for control`};
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
            mockResponseData = { message: "Routine not found for update (mock)" };
        }
    } else if (options.method === 'DELETE' && endpoint.startsWith('/routines/')) {
        const routineId = endpoint.split('/').pop();
        const initialLength = currentMockUser1Routines.length;
        currentMockUser1Routines = currentMockUser1Routines.filter((r: any) => r.id !== routineId);
        if (currentMockUser1Routines.length < initialLength) {
            mockResponseData = { message: `Routine ${routineId} deleted (mock)` };
        } else {
            mockResponseData = { message: `Routine ${routineId} not found for deletion (mock)` };
        }
    } else if (options.method === 'POST' && endpoint.match(/\/routines\/[^/]+\/trigger/)) {
        const routineId = endpoint.split('/')[2];
        const routineIndex = currentMockUser1Routines.findIndex((r: any) => r.id === routineId);
        if (routineIndex > -1) {
            currentMockUser1Routines[routineIndex].lastRun = new Date().toISOString();
             mockResponseData = { message: `Routine ${routineId} triggered successfully (mock)`};
        } else {
            mockResponseData = { message: `Routine ${routineId} not found for trigger (mock)`};
        }
    } else if (options.method === 'POST' && endpoint === '/simulation/floorplan') {
        currentMockUser1FloorPlan = { ...requestBody, userId: 'user1' }; // Assuming requestBody is the full plan
        mockResponseData = { message: "Floor plan saved (mock)", data: currentMockUser1FloorPlan };
    } else if (options.method === 'PUT' && endpoint.startsWith('/settings/user1')) {
        currentMockUser1Settings.theme = requestBody.theme ?? currentMockUser1Settings.theme;
        currentMockUser1Settings.notifications = requestBody.notifications ?? currentMockUser1Settings.notifications;
        currentMockUser1Settings.timezone = requestBody.timezone ?? currentMockUser1Settings.timezone;
        currentMockUser1Settings.updatedAt = new Date().toISOString();
        mockResponseData = { ...currentMockUser1Settings };
    }


    return Promise.resolve(mockResponseData as T);
  }


  const dynamicHeaders = await getAuthHeaders();
  const requestHeaders: HeadersInit = {
    ...dynamicHeaders,
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: requestHeaders,
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = { message: response.statusText || 'API request failed with no JSON body' };
    }
    console.error('API Error:', errorData, 'Status:', response.status, 'Endpoint:', endpoint);
    throw new Error(errorData.message || `API request failed: ${response.status}`);
  }

  if (response.status === 204) { // No Content for DELETE usually
    return null as T;
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.indexOf("application/json") !== -1) {
    return response.json() as Promise<T>;
  } else {
    // If no content type or not JSON, attempt to read as text or return null for success
    // This might happen for successful DELETEs that don't return JSON but also not 204
    try {
        const textResponse = await response.text();
        if(textResponse) {
            console.warn(`Received non-JSON response from ${endpoint}. Content: ${textResponse}`);
            return { message: textResponse } as T; // Or handle as needed
        }
    } catch (e) {
        // If text() fails (e.g. already read or truly empty), just fall through
    }
    console.warn(`Received non-JSON or empty response from ${endpoint}. Content-Type: ${contentType}`);
    return null as T;
  }
}

    