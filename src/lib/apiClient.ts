// src/lib/apiClient.ts
import { auth, type User } from './firebase';

// Import mock data
// Note: Adjust paths if your mock data structure is different or evolves
import mockUser1Devices from './mock-data/devices.json';
import mockUser1Routines from './mock-data/routines.json';
import mockUser1FloorPlanRoot from './mock-data/floorplan.json'; // This contains { user1: { ... } }
const mockUser1FloorPlan = (mockUser1FloorPlanRoot as any).user1;
import mockDashboardSummaryData from './mock-data/dashboardSummary.json';
import mockUser1SettingsRoot from './mock-data/settings.json'; // This contains { user1: { ... } }
const mockUser1Settings = (mockUser1SettingsRoot as any).user1;
import mockAnalyticsSummaryData from './mock-data/analyticsSummary.json';
import mockSimulationHistoryData from './mock-data/simulationHistory.json';
import mockWristbandEventsData from './mock-data/wristbandEvents.json';
import mockLogsData from './mock-data/logs.json';


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
    // Assuming 'user1' for all mock data access for simplicity
    if (endpoint === '/devices') {
      return Promise.resolve(mockUser1Devices.filter(d => d.userId === 'user1') as T);
    }
    if (endpoint === '/routines') {
      return Promise.resolve(mockUser1Routines.filter(r => r.userId === 'user1') as T);
    }
    if (endpoint === '/simulation/floorplan') {
      return Promise.resolve(mockUser1FloorPlan as T);
    }
    if (endpoint.startsWith('/dashboard/summary')) {
      return Promise.resolve(mockDashboardSummaryData as T);
    }
    if (endpoint === ('/settings/user1')) { // Mock only for user1 settings
        return Promise.resolve(mockUser1Settings as T);
    }
    if (endpoint.startsWith('/analytics/summary')) {
       return Promise.resolve(mockAnalyticsSummaryData as T);
     }
     if (endpoint.startsWith('/simulations/history')) {
       return Promise.resolve(mockSimulationHistoryData as T);
     }
      if (endpoint.startsWith('/wristband/events')) { // Corrected from /wristband/event
        return Promise.resolve(mockWristbandEventsData as T);
      }
       if (endpoint.startsWith('/logs')) {
         return Promise.resolve(mockLogsData as T);
       }

    console.warn(`[Mock API Client] No specific mock handler for GET ${endpoint}. Returning empty object/array.`);
    return Promise.resolve((endpoint.includes('[]') ? [] : {}) as T); // Basic heuristic
  }

  if (isMockMode && (options.method === 'POST' || options.method === 'PUT' || options.method === 'DELETE')) {
    console.log(`[Mock API Client] ${options.method} ${endpoint} - Simulating success.`);
    let mockResponseData: any = { message: `${options.method} successful (mock)` };

    const requestBody = options.body ? JSON.parse(options.body as string) : {};

    if (options.method === 'POST' && endpoint === '/devices') {
        mockResponseData = { ...requestBody, id: `mock-device-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), userId: 'user1' };
    } else if (options.method === 'PUT' && endpoint.startsWith('/devices/')) {
        const deviceId = endpoint.split('/').pop();
        mockResponseData = { ...requestBody, id: deviceId, updatedAt: new Date().toISOString(), userId: 'user1' };
    } else if (options.method === 'POST' && endpoint === '/devices/${deviceId}/control') {
        const deviceId = endpoint.split('/')[2];
        // Find device in mock and update its status/settings locally for better demo
        const deviceIndex = mockUser1Devices.findIndex(d => d.id === deviceId);
        if (deviceIndex > -1) {
            mockUser1Devices[deviceIndex] = { ...mockUser1Devices[deviceIndex], ...requestBody, status: requestBody.status || mockUser1Devices[deviceIndex].status, settings: {...mockUser1Devices[deviceIndex].settings, ...requestBody.settings}, updatedAt: new Date().toISOString() };
            mockResponseData = mockUser1Devices[deviceIndex];
        } else {
             mockResponseData = { message: `Mock device ${deviceId} not found for control`};
        }
    } else if (options.method === 'POST' && endpoint === '/routines') {
        mockResponseData = { ...requestBody, id: `mock-routine-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), userId: 'user1' };
    } else if (options.method === 'PUT' && endpoint.startsWith('/routines/')) {
        const routineId = endpoint.split('/').pop();
        mockResponseData = { ...requestBody, id: routineId, updatedAt: new Date().toISOString(), userId: 'user1' };
    } else if (options.method === 'POST' && endpoint.includes('/trigger')) { // for triggering routines
        mockResponseData = { message: `Routine trigger successful for ${endpoint} (mock)`};
    } else if (options.method === 'POST' && endpoint === '/simulation/floorplan') {
        console.log("[Mock API Client] Floor plan data received (not persisted in frontend mock):", requestBody);
        mockResponseData = { message: "Floor plan saved (mock)", data: requestBody };
    } else if (options.method === 'PUT' && endpoint.startsWith('/settings/user1')) {
        mockUser1Settings.theme = requestBody.theme ?? mockUser1Settings.theme;
        mockUser1Settings.notifications = requestBody.notifications ?? mockUser1Settings.notifications;
        mockUser1Settings.timezone = requestBody.timezone ?? mockUser1Settings.timezone;
        mockUser1Settings.updatedAt = new Date().toISOString();
        mockResponseData = { ...mockUser1Settings };
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

  if (response.status === 204) {
    return null as T;
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.indexOf("application/json") !== -1) {
    return response.json() as Promise<T>;
  } else {
    console.warn(`Received non-JSON response from ${endpoint}. Content-Type: ${contentType}`);
    return null as T;
  }
}
