
import { NextResponse, type NextRequest } from 'next/server';
import type { LucideIcon } from 'lucide-react'; // For type reference if needed, though not directly used in API types

// --- Data Structures for API ---
// Matches the structure expected by the frontend, simplified for API storage
// The frontend will rehydrate name/icon for placed devices from its mockSimDevices list using the ID.

interface APIPlacedDevice {
  id: string; // Corresponds to an ID in mockSimDevices
  x: number;
  y: number;
  width: number;
  height: number;
}

interface APIFloorPlanRoom {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  devices: string[];
}

interface FloorPlanData {
  rooms: APIFloorPlanRoom[];
  placedDevices: APIPlacedDevice[];
  selectedFloor: string;
}

// In-memory store for the floor plan data
let storedFloorPlan: FloorPlanData | null = null;

const DEFAULT_DEVICE_ICON_SIZE_PERCENT = 5; // Default size, consistent with frontend

const defaultFloorPlanData: FloorPlanData = {
  rooms: [
    { id: "fp-lr", name: "Living Room", x: 10, y: 10, width: 35, height: 30, devices: ["sim-light-1", "sim-thermo-1"]},
    { id: "fp-k", name: "Kitchen", x: 50, y: 10, width: 25, height: 25, devices: ["sim-speaker-1"]},
    { id: "fp-br", name: "Bedroom", x: 10, y: 45, width: 30, height: 25, devices: ["sim-blinds-1"]},
  ],
  placedDevices: [
    {id: "sim-light-1", x: 15, y: 15, width: DEFAULT_DEVICE_ICON_SIZE_PERCENT, height: DEFAULT_DEVICE_ICON_SIZE_PERCENT},
    {id: "sim-thermo-1", x: 20, y: 20, width: DEFAULT_DEVICE_ICON_SIZE_PERCENT, height: DEFAULT_DEVICE_ICON_SIZE_PERCENT},
    {id: "sim-speaker-1", x: 55, y: 15, width: DEFAULT_DEVICE_ICON_SIZE_PERCENT, height: DEFAULT_DEVICE_ICON_SIZE_PERCENT},
    {id: "sim-blinds-1", x: 15, y: 50, width: DEFAULT_DEVICE_ICON_SIZE_PERCENT, height: DEFAULT_DEVICE_ICON_SIZE_PERCENT},
  ],
  selectedFloor: "Ground Floor"
};


export async function GET(request: NextRequest) {
  try {
    if (storedFloorPlan) {
      return NextResponse.json(storedFloorPlan);
    }
    // If nothing is stored, return a default plan or an empty structure
    // For now, let's return the default structure if nothing is stored yet.
    // In a real app, this would fetch from a database.
    return NextResponse.json(defaultFloorPlanData);
  } catch (error) {
    console.error("GET /api/simulation/floorplan Error:", error);
    return NextResponse.json({ message: "Error fetching floor plan data" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: FloorPlanData = await request.json();
    
    // Validate the incoming data (basic validation for now)
    if (!body || !Array.isArray(body.rooms) || !Array.isArray(body.placedDevices) || typeof body.selectedFloor !== 'string') {
      return NextResponse.json({ message: "Invalid floor plan data provided" }, { status: 400 });
    }

    storedFloorPlan = body; // Store the received data in memory
    console.log("POST /api/simulation/floorplan: Data saved to in-memory store.");
    return NextResponse.json({ message: "Floor plan saved successfully" }, { status: 200 });
  } catch (error) {
    console.error("POST /api/simulation/floorplan Error:", error);
    return NextResponse.json({ message: "Error saving floor plan data" }, { status: 500 });
  }
}
