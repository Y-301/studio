
"use client";
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WakeUpSimulator } from "@/components/simulation/WakeUpSimulator";
import { DeviceCard, type Device } from '@/components/devices/DeviceCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SlidersHorizontal, Zap, House, Eye, Edit, PlusSquare, Trash2, Maximize, ChevronsUpDown, Lightbulb, Thermometer, Speaker, LayoutPanelLeft, MapPin, Palette, GripVertical, Save, Loader2, Move, Plus, Maximize2, Minimize2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { Slider } from "@/components/ui/slider";
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


// Mock devices for simulation
const mockSimDevices: Device[] = [
  { id: "sim-light-1", name: "Living Room Main Light", type: "light", status: "Off", room: "Living Room", icon: Lightbulb, dataAiHint: "ceiling light", brightness: 80, connectionDetails: "" },
  { id: "sim-thermo-1", name: "Living Room Thermostat", type: "thermostat", status: "20°C", room: "Living Room", icon: Thermometer, dataAiHint: "smart thermostat", connectionDetails: "" },
  { id: "sim-speaker-1", name: "Kitchen Speaker", type: "speaker", status: "Paused", room: "Kitchen", icon: Speaker, dataAiHint: "kitchen speaker", volume: 30, connectionDetails: "" },
  { id: "sim-blinds-1", name: "Bedroom Blinds", type: "blinds", status: "Closed", room: "Bedroom", icon: LayoutPanelLeft, dataAiHint: "bedroom blinds", connectionDetails: "" },
  { id: "sim-unassigned-1", name: "New Sensor", type: "sensor", status: "Waiting", room: "Unassigned", icon: Zap, dataAiHint: "iot sensor", connectionDetails: "" }
];

const initialMockRooms = ["Living Room", "Bedroom", "Kitchen", "Office", "Unassigned"];
const initialMockFloors = ["Ground Floor", "First Floor"];

// Frontend state structure
interface FloorPlanRoom {
  id: string;
  name: string;
  x: number; // Percentage
  y: number; // Percentage
  width: number; // Percentage
  height: number; // Percentage
  devices: string[]; // IDs of devices in this room
}

interface FloorPlanDevice {
  id: string;
  name: string;
  icon: React.ElementType;
  x: number; // Percentage
  y: number; // Percentage
  width: number; // Percentage (for icon container)
  height: number; // Percentage (for icon container)
}

// API data structure (mirroring what's in the API route)
interface APIPlacedDevice {
  id: string;
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
interface FloorPlanDataFromAPI {
  rooms: APIFloorPlanRoom[];
  placedDevices: APIPlacedDevice[];
  selectedFloor: string;
}


interface DraggingInfo {
  id: string;
  type: 'room' | 'device';
  initialXPercent: number;
  initialYPercent: number;
  offsetXPercent: number;
  offsetYPercent: number;
  elementWidthPercent: number;
  elementHeightPercent: number;
}

type ResizeHandleType = 'n' | 's' | 'e' | 'w' | 'nw' | 'ne' | 'sw' | 'se';
interface ResizingInfo {
  id: string; // Room ID
  initialXPercent: number;
  initialYPercent: number;
  initialWidthPercent: number;
  initialHeightPercent: number;
  startMouseXPercent: number;
  startMouseYPercent: number;
  activeHandle: ResizeHandleType;
}

const MIN_ROOM_SIZE_PERCENT = 10;
const DEVICE_ICON_CONTAINER_SIZE_PERCENT = 7; // Slightly larger for better icon visibility


export default function SimulationPage() {
  const [editMode, setEditMode] = useState(false);
  const [availableFloors, setAvailableFloors] = useState<string[]>(initialMockFloors);
  const [selectedFloor, setSelectedFloor] = useState(initialMockFloors[0]);
  const [newFloorNameInput, setNewFloorNameInput] = useState("");
  const [selectedRoomTab, setSelectedRoomTab] = useState("All");
  const { toast } = useToast();
  const floorPlanRef = useRef<HTMLDivElement>(null);

  const [floorPlanRooms, setFloorPlanRooms] = useState<FloorPlanRoom[]>([]);
  const [floorPlanDevices, setFloorPlanDevices] = useState<FloorPlanDevice[]>([]);

  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [isAddDeviceModalOpen, setIsAddDeviceModalOpen] = useState(false);
  const [deviceToAddToPlan, setDeviceToAddToPlan] = useState<string | undefined>();

  const [draggingElementInfo, setDraggingElementInfo] = useState<DraggingInfo | null>(null);
  const [resizingRoomInfo, setResizingRoomInfo] = useState<ResizingInfo | null>(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);
  const [isSavingPlan, setIsSavingPlan] = useState(false);


  useEffect(() => {
    const loadPlan = async () => {
      setIsLoadingPlan(true);
      try {
        const response = await fetch('/api/simulation/floorplan');
        if (!response.ok) {
          throw new Error(`Failed to fetch floor plan: ${response.statusText}`);
        }
        const data: FloorPlanDataFromAPI = await response.json();

        setFloorPlanRooms(data.rooms.map(room => ({ ...room })));

        const hydratedDevices = data.placedDevices.map(apiDevice => {
          const fullDevice = mockSimDevices.find(d => d.id === apiDevice.id);
          return {
            id: apiDevice.id,
            name: fullDevice?.name || 'Unknown Device',
            icon: fullDevice?.icon || Palette,
            x: apiDevice.x,
            y: apiDevice.y,
            width: apiDevice.width || DEVICE_ICON_CONTAINER_SIZE_PERCENT,
            height: apiDevice.height || DEVICE_ICON_CONTAINER_SIZE_PERCENT,
          };
        });
        setFloorPlanDevices(hydratedDevices);
        setSelectedFloor(data.selectedFloor || initialMockFloors[0]);
        if (data.selectedFloor && !initialMockFloors.includes(data.selectedFloor) && !availableFloors.includes(data.selectedFloor)) {
          setAvailableFloors(prev => [...prev, data.selectedFloor]);
        }
        toast({ title: "Floor plan loaded", description: "Retrieved existing floor plan."});
      } catch (error) {
        console.error("Error loading floor plan:", error);
        toast({ title: "Error Loading Plan", description: (error as Error).message, variant: "destructive" });
        setFloorPlanRooms([
          { id: "fp-lr-default", name: "Living Room (Default)", x: 10, y: 10, width: 35, height: 30, devices: ["sim-light-1"]},
        ]);
        setFloorPlanDevices([
          {id: "sim-light-1", name: "LR Light", icon: Lightbulb, x: 15, y: 15, width: DEVICE_ICON_CONTAINER_SIZE_PERCENT, height: DEVICE_ICON_CONTAINER_SIZE_PERCENT},
        ]);
      } finally {
        setIsLoadingPlan(false);
      }
    };
    loadPlan();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddFloor = () => {
    if (newFloorNameInput.trim() && !availableFloors.includes(newFloorNameInput.trim())) {
      const newFloor = newFloorNameInput.trim();
      setAvailableFloors(prev => [...prev, newFloor]);
      setSelectedFloor(newFloor);
      setFloorPlanRooms([]); // Clear rooms for new floor
      setFloorPlanDevices([]); // Clear devices for new floor
      setNewFloorNameInput("");
      toast({ title: "Floor Added (Client-side)", description: `${newFloor} added. Save plan to persist.` });
    } else if (availableFloors.includes(newFloorNameInput.trim())) {
      toast({ title: "Floor Exists", description: "This floor name already exists.", variant: "default" });
    } else {
      toast({ title: "Invalid Name", description: "Please enter a valid floor name.", variant: "destructive" });
    }
  };


  const handleSavePlan = async () => {
    setIsSavingPlan(true);
    try {
      const apiPlacedDevices: APIPlacedDevice[] = floorPlanDevices.map(fpd => ({
        id: fpd.id,
        x: fpd.x,
        y: fpd.y,
        width: fpd.width,
        height: fpd.height,
      }));

      const dataToSave: FloorPlanDataFromAPI = {
        rooms: floorPlanRooms,
        placedDevices: apiPlacedDevices,
        selectedFloor: selectedFloor,
      };

      const response = await fetch('/api/simulation/floorplan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to save floor plan: ${response.statusText}`);
      }
      toast({ title: "Floor Plan Saved", description: "Your changes have been saved successfully." });
    } catch (error) {
      console.error("Error saving floor plan:", error);
      toast({ title: "Error Saving Plan", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSavingPlan(false);
    }
  };


  const devicesForSelectedRoom = selectedRoomTab === "All"
    ? mockSimDevices
    : mockSimDevices.filter(d => d.room === selectedRoomTab);

  const handleAddRoomToPlan = () => {
    if (!newRoomName.trim()) {
        toast({ title: "Error", description: "Room name cannot be empty.", variant: "destructive" });
        return;
    }
    const newRoom: FloorPlanRoom = {
        id: `fp-room-${Date.now()}`,
        name: newRoomName,
        x: 10,
        y: 10,
        width: 20,
        height: 20,
        devices: [],
    };
    setFloorPlanRooms(prev => [...prev, newRoom]);
    toast({ title: "Room Added", description: `${newRoomName} added to the floor plan.` });
    setIsAddRoomModalOpen(false);
    setNewRoomName("");
  };

  const handleAddDeviceToPlan = () => {
    if (!deviceToAddToPlan) {
        toast({ title: "Error", description: "Please select a device.", variant: "destructive" });
        return;
    }
    const device = mockSimDevices.find(d => d.id === deviceToAddToPlan);
    if (!device) {
        toast({ title: "Error", description: "Device not found.", variant: "destructive" });
        return;
    }
    if (floorPlanDevices.find(fpd => fpd.id === device.id)) {
        toast({ title: "Already Added", description: `${device.name} is already on the plan.`});
        return;
    }
    const newFPDevice: FloorPlanDevice = {
        id: device.id,
        name: device.name,
        icon: device.icon,
        x: 15, // Default position
        y: 15,
        width: DEVICE_ICON_CONTAINER_SIZE_PERCENT,
        height: DEVICE_ICON_CONTAINER_SIZE_PERCENT,
    };
    setFloorPlanDevices(prev => [...prev, newFPDevice]);
    toast({ title: "Device Added to Plan", description: `${device.name} added.` });
    setIsAddDeviceModalOpen(false);
    setDeviceToAddToPlan(undefined);
  };

  const handleDeviceControlChange = (deviceId: string, controlType: "brightness" | "volume" | "status", value: any) => {
    toast({ title: "Device Control (List Demo)", description: `Control ${deviceId} ${controlType} to ${value}`});
  };

   const handleDeviceSimulationControl = (deviceId: string, controlType: "brightness" | "volume" | "status", value: any) => {
    const device = mockSimDevices.find(d => d.id === deviceId);
    if (device) {
      console.log(`Sim: ${device.name} ${controlType} changed to ${value}. (Visual effect only)`);
      toast({ title: "Device Control (Sim Effect)", description: `${device.name} ${controlType} set to ${value} in simulation.`});
    }
  };

  const checkRoomCollision = (updatedRoom: FloorPlanRoom, existingRooms: FloorPlanRoom[]): boolean => {
    for (const existingRoom of existingRooms) {
      if (existingRoom.id === updatedRoom.id) continue;
      const r1 = updatedRoom;
      const r2 = existingRoom;
      const collision = r1.x < r2.x + r2.width &&
                        r1.x + r1.width > r2.x &&
                        r1.y < r2.y + r2.height &&
                        r1.y + r1.height > r2.y;
      if (collision) return true;
    }
    return false;
  };

  const handleMouseDownShared = (e: React.MouseEvent, id: string, type: 'room' | 'device') => {
    if (!editMode || !floorPlanRef.current) return;
    e.preventDefault();
    const element = type === 'room' ? floorPlanRooms.find(r => r.id === id) : floorPlanDevices.find(d => d.id === id);
    if (!element) return;

    const containerRect = floorPlanRef.current.getBoundingClientRect();
    const initialMouseX = (e.clientX - containerRect.left) / containerRect.width * 100;
    const initialMouseY = (e.clientY - containerRect.top) / containerRect.height * 100;

    setDraggingElementInfo({
      id: id,
      type: type,
      initialXPercent: element.x,
      initialYPercent: element.y,
      offsetXPercent: initialMouseX - element.x,
      offsetYPercent: initialMouseY - element.y,
      elementWidthPercent: element.width,
      elementHeightPercent: element.height,
    });
  };

  const handleResizeMouseDown = (e: React.MouseEvent, roomId: string, handle: ResizeHandleType) => {
    if (!editMode || !floorPlanRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    const room = floorPlanRooms.find(r => r.id === roomId);
    if (!room) return;

    const containerRect = floorPlanRef.current.getBoundingClientRect();
    setResizingRoomInfo({
      id: roomId,
      initialXPercent: room.x,
      initialYPercent: room.y,
      initialWidthPercent: room.width,
      initialHeightPercent: room.height,
      startMouseXPercent: (e.clientX - containerRect.left) / containerRect.width * 100,
      startMouseYPercent: (e.clientY - containerRect.top) / containerRect.height * 100,
      activeHandle: handle,
    });
  };

  useEffect(() => {
    if (!draggingElementInfo && !resizingRoomInfo) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      if (!floorPlanRef.current) return;
      const containerRect = floorPlanRef.current.getBoundingClientRect();
      const mouseXPercent = (e.clientX - containerRect.left) / containerRect.width * 100;
      const mouseYPercent = (e.clientY - containerRect.top) / containerRect.height * 100;

      if (draggingElementInfo) {
        let newX = mouseXPercent - draggingElementInfo.offsetXPercent;
        let newY = mouseYPercent - draggingElementInfo.offsetYPercent;

        newX = Math.max(0, Math.min(newX, 100 - draggingElementInfo.elementWidthPercent));
        newY = Math.max(0, Math.min(newY, 100 - draggingElementInfo.elementHeightPercent));

        if (draggingElementInfo.type === 'room') {
          const currentRoom = floorPlanRooms.find(r => r.id === draggingElementInfo.id);
          if (!currentRoom) return;
          const updatedRoom: FloorPlanRoom = { ...currentRoom, x: newX, y: newY };
          if (!checkRoomCollision(updatedRoom, floorPlanRooms.filter(r => r.id !== draggingElementInfo.id))) {
            setFloorPlanRooms(prev => prev.map(r => r.id === draggingElementInfo.id ? updatedRoom : r));
          }
        } else {
          setFloorPlanDevices(prev => prev.map(d => d.id === draggingElementInfo.id ? { ...d, x: newX, y: newY } : d));
        }
      } else if (resizingRoomInfo) {
        const room = floorPlanRooms.find(r => r.id === resizingRoomInfo.id);
        if (!room) return;

        const deltaX = mouseXPercent - resizingRoomInfo.startMouseXPercent;
        const deltaY = mouseYPercent - resizingRoomInfo.startMouseYPercent;

        let newX = room.x;
        let newY = room.y;
        let newWidth = room.width;
        let newHeight = room.height;

        switch (resizingRoomInfo.activeHandle) {
          case 'n':
            newY = resizingRoomInfo.initialYPercent + deltaY;
            newHeight = resizingRoomInfo.initialHeightPercent - deltaY;
            break;
          case 's':
            newHeight = resizingRoomInfo.initialHeightPercent + deltaY;
            break;
          case 'w':
            newX = resizingRoomInfo.initialXPercent + deltaX;
            newWidth = resizingRoomInfo.initialWidthPercent - deltaX;
            break;
          case 'e':
            newWidth = resizingRoomInfo.initialWidthPercent + deltaX;
            break;
          case 'nw':
            newX = resizingRoomInfo.initialXPercent + deltaX;
            newY = resizingRoomInfo.initialYPercent + deltaY;
            newWidth = resizingRoomInfo.initialWidthPercent - deltaX;
            newHeight = resizingRoomInfo.initialHeightPercent - deltaY;
            break;
          case 'ne':
            newY = resizingRoomInfo.initialYPercent + deltaY;
            newWidth = resizingRoomInfo.initialWidthPercent + deltaX;
            newHeight = resizingRoomInfo.initialHeightPercent - deltaY;
            break;
          case 'sw':
            newX = resizingRoomInfo.initialXPercent + deltaX;
            newWidth = resizingRoomInfo.initialWidthPercent - deltaX;
            newHeight = resizingRoomInfo.initialHeightPercent + deltaY;
            break;
          case 'se':
            newWidth = resizingRoomInfo.initialWidthPercent + deltaX;
            newHeight = resizingRoomInfo.initialHeightPercent + deltaY;
            break;
        }
        
        // Boundary and size checks
        if (newWidth < MIN_ROOM_SIZE_PERCENT) {
            if (resizingRoomInfo.activeHandle.includes('w')) newX = room.x + room.width - MIN_ROOM_SIZE_PERCENT;
            newWidth = MIN_ROOM_SIZE_PERCENT;
        }
        if (newHeight < MIN_ROOM_SIZE_PERCENT) {
            if (resizingRoomInfo.activeHandle.includes('n')) newY = room.y + room.height - MIN_ROOM_SIZE_PERCENT;
            newHeight = MIN_ROOM_SIZE_PERCENT;
        }

        newX = Math.max(0, newX);
        newY = Math.max(0, newY);
        if (newX + newWidth > 100) newWidth = 100 - newX;
        if (newY + newHeight > 100) newHeight = 100 - newY;
        
        const updatedRoom: FloorPlanRoom = { ...room, x: newX, y: newY, width: newWidth, height: newHeight };

        if (!checkRoomCollision(updatedRoom, floorPlanRooms.filter(r => r.id !== resizingRoomInfo.id))) {
            setFloorPlanRooms(prev => prev.map(r => r.id === resizingRoomInfo.id ? updatedRoom : r));
        }
      }
    };

    const handleWindowMouseUp = () => {
      setDraggingElementInfo(null);
      setResizingRoomInfo(null);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [draggingElementInfo, resizingRoomInfo, floorPlanRooms, floorPlanDevices, editMode]);


  const resizeHandles: ResizeHandleType[] = ['n', 's', 'e', 'w', 'nw', 'ne', 'sw', 'se'];
  const getResizeHandleStyle = (handle: ResizeHandleType): React.CSSProperties => {
    const size = '8px';
    const offset = '-4px';
    switch (handle) {
      case 'n': return { top: offset, left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize', width: 'calc(100% - 16px)', height: size, marginLeft: '8px', marginRight: '8px' };
      case 's': return { bottom: offset, left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize', width: 'calc(100% - 16px)', height: size, marginLeft: '8px', marginRight: '8px' };
      case 'w': return { left: offset, top: '50%', transform: 'translateY(-50%)', cursor: 'ew-resize', width: size, height: 'calc(100% - 16px)', marginTop: '8px', marginBottom: '8px'  };
      case 'e': return { right: offset, top: '50%', transform: 'translateY(-50%)', cursor: 'ew-resize', width: size, height: 'calc(100% - 16px)', marginTop: '8px', marginBottom: '8px' };
      case 'nw': return { top: offset, left: offset, cursor: 'nwse-resize', width: size, height: size };
      case 'ne': return { top: offset, right: offset, cursor: 'nesw-resize', width: size, height: size };
      case 'sw': return { bottom: offset, left: offset, cursor: 'nesw-resize', width: size, height: size };
      case 'se': return { bottom: offset, right: offset, cursor: 'nwse-resize', width: size, height: size };
      default: return {};
    }
  };


  if (isLoadingPlan) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Loading Floor Plan...</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">House &amp; Wake-Up Simulation</h1>
          <p className="text-muted-foreground">
            Visualize your home, manage rooms, place devices, and test wake-up scenarios.
          </p>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <House className="h-6 w-6 text-primary" />
            House Floor Plan ({selectedFloor})
          </CardTitle>
          <CardDescription>
            {editMode ? "Edit your floor plan: add, move, resize rooms and place devices." : "View your current home layout and device placements."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
            <div className="flex gap-2 flex-wrap items-center">
              <Button onClick={() => setEditMode(!editMode)} variant={editMode ? "default" : "outline"} className="shadow-sm">
                {editMode ? <Eye className="mr-2 h-4 w-4" /> : <Edit className="mr-2 h-4 w-4" />}
                {editMode ? "View Mode" : "Edit Mode"}
              </Button>
              <Select value={selectedFloor} onValueChange={(newFloor) => { setSelectedFloor(newFloor); setFloorPlanRooms([]); setFloorPlanDevices([]); /* TODO: Load plan for newFloor */ }}>
                <SelectTrigger className="w-full sm:w-[180px] shadow-sm">
                  <SelectValue placeholder="Select floor" />
                </SelectTrigger>
                <SelectContent>
                  {availableFloors.map(floor => <SelectItem key={floor} value={floor}>{floor}</SelectItem>)}
                </SelectContent>
              </Select>
              {editMode && (
                <div className="flex items-center gap-1">
                  <Input 
                    type="text" 
                    placeholder="New floor name" 
                    value={newFloorNameInput} 
                    onChange={(e) => setNewFloorNameInput(e.target.value)}
                    className="h-9 text-xs w-[120px] shadow-sm"
                  />
                  <Button variant="outline" size="icon" className="h-9 w-9 shadow-sm" onClick={handleAddFloor} title="Add new floor">
                    <Plus className="h-4 w-4"/>
                  </Button>
                </div>
              )}
            </div>
            {editMode && (
              <div className="flex gap-2 mt-2 sm:mt-0 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => setIsAddRoomModalOpen(true)} className="shadow-sm"><PlusSquare className="mr-2 h-4 w-4" /> Add Room</Button>
                <Button variant="outline" size="sm" onClick={() => setIsAddDeviceModalOpen(true)} className="shadow-sm"><Maximize className="mr-2 h-4 w-4" /> Add Device</Button>
                <Button variant="default" size="sm" onClick={handleSavePlan} disabled={isSavingPlan} className="shadow-md">
                  {isSavingPlan ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Plan
                </Button>
              </div>
            )}
          </div>

          <div
            id="floor-plan-container"
            ref={floorPlanRef}
            className={cn(
                "relative w-full h-[400px] md:h-[500px] bg-muted/30 border-2 border-border rounded-lg flex items-center justify-center overflow-hidden p-2 shadow-inner select-none",
                editMode && "border-dashed border-primary/50", // Removed cursor-grab globally
                (draggingElementInfo || resizingRoomInfo) && "cursor-grabbing" // Apply grabbing cursor only during operation
            )}
            style={{
                 backgroundImage: editMode ? 'linear-gradient(hsl(var(--border)/0.3) 1px, transparent 1px), linear-gradient(to right, hsl(var(--border)/0.3) 1px, transparent 1px)' : 'none',
                 backgroundSize: editMode ? '20px 20px' : 'auto',
            }}
          >
            {floorPlanRooms.length === 0 && floorPlanDevices.length === 0 && (
                 <div className="text-center text-muted-foreground p-4">
                    <ChevronsUpDown className="mx-auto h-12 w-12 mb-2" />
                    <p className="font-semibold">Empty Floor Plan</p>
                    <p className="text-sm">{editMode ? "Click 'Add Room' or 'Add Device' to get started." : "No rooms or devices placed on this floor yet."}</p>
                </div>
            )}
            {floorPlanRooms.map(room => (
                <div key={room.id}
                    className={cn(
                        "absolute bg-primary/20 border border-primary rounded p-1 text-xs text-primary-foreground flex items-center justify-center shadow-md transition-all duration-100",
                        editMode && "hover:border-primary/80 hover:bg-primary/30",
                        draggingElementInfo?.id === room.id && "opacity-70 ring-2 ring-primary z-10 shadow-xl cursor-grabbing",
                        resizingRoomInfo?.id === room.id && "opacity-70 ring-2 ring-accent z-10 shadow-xl",
                        !draggingElementInfo && !resizingRoomInfo && editMode && "cursor-grab"
                    )}
                    style={{
                        left: `${room.x}%`, top: `${room.y}%`,
                        width: `${room.width}%`, height: `${room.height}%`,
                    }}
                    onMouseDown={(e) => handleMouseDownShared(e, room.id, 'room')}
                >
                    <span className="truncate pointer-events-none select-none">{room.name}</span>
                    {editMode && (
                        <>
                          <Tooltip>
                            <TooltipTrigger asChild>
                               <Button variant="ghost" size="icon" className="absolute -top-2 -right-2 h-5 w-5 bg-destructive/80 hover:bg-destructive text-destructive-foreground rounded-full p-0.5 z-20 shadow cursor-pointer" onClick={(e) => { e.stopPropagation(); setFloorPlanRooms(prev => prev.filter(r => r.id !== room.id)); toast({title:"Room Removed", description: `${room.name} removed from plan.`})}}><Trash2 className="h-3 w-3"/></Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Delete {room.name}</p></TooltipContent>
                          </Tooltip>
                          {resizeHandles.map(handle => (
                            <div
                              key={handle}
                              className="absolute bg-accent/50 hover:bg-accent border border-background rounded-sm z-20"
                              style={getResizeHandleStyle(handle)}
                              onMouseDown={(e) => handleResizeMouseDown(e, room.id, handle)}
                            />
                          ))}
                        </>
                    )}
                </div>
            ))}
             {floorPlanDevices.map(device => {
                const DeviceIconComponent = device.icon || Palette;
                return (
                    <div key={device.id}
                        className={cn(
                            "absolute flex flex-col items-center justify-center text-center group", // Removed padding, border, bg from container
                            editMode && "hover:ring-2 hover:ring-accent/50 rounded-md",
                            draggingElementInfo?.id === device.id && "opacity-70 ring-2 ring-accent z-10 shadow-lg cursor-grabbing",
                            !draggingElementInfo && !resizingRoomInfo && editMode && "cursor-grab"
                        )}
                         style={{ left: `${device.x}%`, top: `${device.y}%`, width: `${device.width}%`, height: `${device.height}%`}}
                         title={device.name}
                         onMouseDown={(e) => handleMouseDownShared(e, device.id, 'device')}
                    >
                        <DeviceIconComponent className="w-full h-full text-primary p-0.5 pointer-events-none select-none"/>
                        <span className="absolute -bottom-3 text-[9px] text-muted-foreground truncate max-w-full block leading-tight pointer-events-none select-none opacity-0 group-hover:opacity-100 transition-opacity">
                            {device.name.split(" ")[0]}
                        </span>
                        {editMode &&
                          <Tooltip>
                            <TooltipTrigger asChild>
                               <Button variant="ghost" size="icon" className="absolute -top-1 -right-1 h-4 w-4 bg-destructive/80 hover:bg-destructive text-destructive-foreground rounded-full p-0.5 z-20 shadow cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); setFloorPlanDevices(prev => prev.filter(d => d.id !== device.id)); toast({title:"Device Removed from Plan", description: `${device.name} removed.`})}}><Trash2 className="h-2 w-2"/></Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Remove {device.name}</p></TooltipContent>
                          </Tooltip>
                        }
                    </div>
                );
            })}
            {editMode && !draggingElementInfo && !resizingRoomInfo && (
                <p className="absolute bottom-2 left-2 text-xs text-muted-foreground bg-background/80 p-1 rounded shadow">Edit Mode: Drag rooms/devices. Resize rooms using handles.</p>
            )}
             {(draggingElementInfo || resizingRoomInfo) && (
                 <p className="absolute bottom-2 left-2 text-xs text-primary bg-background/80 p-1 rounded font-semibold animate-pulse shadow">
                    {draggingElementInfo ? `Dragging ${draggingElementInfo.type}...` : "Resizing room..."}
                </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isAddRoomModalOpen} onOpenChange={setIsAddRoomModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Room to Plan</DialogTitle><DialogDescription>Enter the name for the new room.</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <Label htmlFor="new-room-name">Room Name</Label>
            <Input id="new-room-name" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} placeholder="e.g., Master Bedroom" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddRoomModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddRoomToPlan}>Add Room</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddDeviceModalOpen} onOpenChange={setIsAddDeviceModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Device to Floor Plan</DialogTitle><DialogDescription>Select an existing device to place on the plan.</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <Label htmlFor="device-to-add-select">Select Device</Label>
            <Select value={deviceToAddToPlan} onValueChange={setDeviceToAddToPlan}>
                <SelectTrigger id="device-to-add-select"><SelectValue placeholder="Choose a device" /></SelectTrigger>
                <SelectContent>
                    {mockSimDevices.filter(d_item => !floorPlanDevices.find(fpd => fpd.id === d_item.id)).map(d_item => (
                        <SelectItem key={d_item.id} value={d_item.id}>{d_item.name} ({d_item.type})</SelectItem>
                    ))}
                    {mockSimDevices.filter(d_item => !floorPlanDevices.find(fpd => fpd.id === d_item.id)).length === 0 && <p className="p-2 text-sm text-muted-foreground">All devices already added to plan.</p>}
                </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDeviceModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddDeviceToPlan}>Add to Plan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <Card>
        <CardHeader>
            <CardTitle>Device Controls by Room ({selectedFloor})</CardTitle>
            <CardDescription>Interact with devices based on the selected room in your simulation.</CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs value={selectedRoomTab} onValueChange={setSelectedRoomTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-6 mb-4">
                    <TabsTrigger value="All">All</TabsTrigger>
                    {initialMockRooms.map(room => (
                        <TabsTrigger key={room} value={room}>{room}</TabsTrigger>
                    ))}
                </TabsList>
                 <TabsContent value={selectedRoomTab} className="mt-0">
                    {devicesForSelectedRoom.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {devicesForSelectedRoom.map(device => (
                                <DeviceCard
                                    key={device.id}
                                    {...device}
                                    onBrightnessChange={(value) => handleDeviceControlChange(device.id, "brightness", value)}
                                    onVolumeChange={(value) => handleDeviceControlChange(device.id, "volume", value)}
                                      onSimulationBrightnessChange={(value) => handleDeviceSimulationControl(device.id, "brightness", value)}
                                        onSimulationVolumeChange={(value) => handleDeviceSimulationControl(device.id, "volume", value)}
                                    onToggle={(isOn) => handleDeviceControlChange(device.id, "status", isOn ? "On" : "Off")}
                                    onColorChange={() => toast({title:"Change Color (Sim Demo)"})}
                                />
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center py-8">No devices in {selectedRoomTab} on {selectedFloor}.</p>
                    )}
                </TabsContent>
            </Tabs>
        </CardContent>
      </Card>


      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SlidersHorizontal className="h-6 w-6 text-primary" />
            Wake-Up Simulation
          </CardTitle>
          <CardDescription>
            Fine-tune your gentle wake-up settings. Adjust light intensity, soundscapes, and duration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WakeUpSimulator />
        </CardContent>
      </Card>
    </div>
    </TooltipProvider>
  );
}

