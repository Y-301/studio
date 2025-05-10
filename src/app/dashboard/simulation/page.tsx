
"use client";
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WakeUpSimulator } from "@/components/simulation/WakeUpSimulator";
import { DeviceCard, type Device } from '@/components/devices/DeviceCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SlidersHorizontal, Zap, House, Eye, Edit, PlusSquare, Trash2, Maximize, ChevronsUpDown, Lightbulb, Thermometer, Speaker, LayoutPanelLeft, MapPin, Palette, GripVertical, Save, Loader2, Move } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
const mockFloors = ["Ground Floor", "First Floor"];

// Frontend state structure
interface FloorPlanRoom {
  id: string;
  name: string;
  x: number; // Percentage
  y: number; // Percentage
  width: number; // Percentage
  height: number; // Percentage
  devices: string[];
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

interface ResizingInfo {
  id: string; // Room ID
  initialXPercent: number;
  initialYPercent: number;
  initialWidthPercent: number;
  initialHeightPercent: number;
  startMouseXPercent: number;
  startMouseYPercent: number;
}

const MIN_ROOM_SIZE_PERCENT = 10;
const DEVICE_ICON_SIZE_PERCENT = 5;


export default function SimulationPage() {
  const [editMode, setEditMode] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState(mockFloors[0]);
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

  // Helper to get icon component from device type string
  const getIconComponent = (type: string): React.ElementType => {
    const device = mockSimDevices.find(d => d.type === type); // Or a dedicated map
    return device?.icon || Palette; // Fallback icon
  };

  // Load floor plan data on mount
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
            ...apiDevice,
            name: fullDevice?.name || 'Unknown Device',
            icon: fullDevice?.icon || Palette,
          };
        });
        setFloorPlanDevices(hydratedDevices);
        setSelectedFloor(data.selectedFloor || mockFloors[0]);
        toast({ title: "Floor plan loaded", description: "Retrieved existing floor plan."});
      } catch (error) {
        console.error("Error loading floor plan:", error);
        toast({ title: "Error Loading Plan", description: (error as Error).message, variant: "destructive" });
        setFloorPlanRooms([
          { id: "fp-lr", name: "Living Room (Default)", x: 10, y: 10, width: 35, height: 30, devices: ["sim-light-1", "sim-thermo-1"]},
        ]);
        setFloorPlanDevices([
          {id: "sim-light-1", name: "LR Light", icon: Lightbulb, x: 15, y: 15, width: DEVICE_ICON_SIZE_PERCENT, height: DEVICE_ICON_SIZE_PERCENT},
        ]);
      } finally {
        setIsLoadingPlan(false);
      }
    };
    loadPlan();
  }, [toast]);

  // Save floor plan data
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
        x: Math.random() * 50 + 5,
        y: Math.random() * 50 + 5,
        width: Math.random() * 15 + MIN_ROOM_SIZE_PERCENT,
        height: Math.random() * 10 + MIN_ROOM_SIZE_PERCENT,
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
        x: Math.random() * 70 + 5,
        y: Math.random() * 70 + 5,
        width: DEVICE_ICON_SIZE_PERCENT,
        height: DEVICE_ICON_SIZE_PERCENT,
    };
    setFloorPlanDevices(prev => [...prev, newFPDevice]);
    toast({ title: "Device Added to Plan", description: `${device.name} added.` });
    setIsAddDeviceModalOpen(false);
    setDeviceToAddToPlan(undefined);
  };

  const handleDeviceControlChange = (deviceId: string, controlType: "brightness" | "volume" | "status", value: any) => {
    const deviceIndex = mockSimDevices.findIndex(d => d.id === deviceId);
    if (deviceIndex !== -1) {
        let statusMessage = `${mockSimDevices[deviceIndex].name} ${controlType} set to ${value}`;
        if (controlType === "status") {
             statusMessage = `${mockSimDevices[deviceIndex].name} turned ${value ? "On" : "Off"}`;
        }
        toast({ title: "Device Control (List Demo)", description: statusMessage });
    }
  };

   const handleDeviceSimulationControl = (deviceId: string, controlType: "brightness" | "volume" | "status", value: any) => {
    const deviceIndex = mockSimDevices.findIndex(d => d.id === deviceId);
    if (deviceIndex !== -1) {
        const updatedDevices = [...mockSimDevices]; // Create a mutable copy
        const deviceToUpdate = { ...updatedDevices[deviceIndex] };
        if (controlType === "brightness") deviceToUpdate.brightness = value;
        if (controlType === "volume") deviceToUpdate.volume = value;
        if (controlType === "status") deviceToUpdate.status = value ? "On" : "Off"; // Update status string

        // This part is tricky with const mockSimDevices. For a real app, mockSimDevices would be state.
        // For demo, we'll log and toast. To make DeviceCard reflect, mockSimDevices should be stateful.
        console.log(`Sim: ${deviceId} ${controlType} changed to ${value}.`);
        toast({ title: "Device Control (Sim Effect)", description: `${mockSimDevices[deviceIndex].name} ${controlType} set to ${value} in simulation.`});
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

  const handleResizeMouseDown = (e: React.MouseEvent, roomId: string) => {
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

        let newWidth = resizingRoomInfo.initialWidthPercent + (mouseXPercent - resizingRoomInfo.startMouseXPercent);
        let newHeight = resizingRoomInfo.initialHeightPercent + (mouseYPercent - resizingRoomInfo.startMouseYPercent);

        newWidth = Math.max(MIN_ROOM_SIZE_PERCENT, Math.min(newWidth, 100 - resizingRoomInfo.initialXPercent));
        newHeight = Math.max(MIN_ROOM_SIZE_PERCENT, Math.min(newHeight, 100 - resizingRoomInfo.initialYPercent));

        const updatedRoom: FloorPlanRoom = { ...room, width: newWidth, height: newHeight };

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
  }, [draggingElementInfo, resizingRoomInfo, floorPlanRooms, floorPlanDevices, editMode]); // Removed setFloorPlanDevices from deps as it's part of draggingElementInfo logic


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
            House Floor Plan Simulation
          </CardTitle>
          <CardDescription>
            {editMode ? "Edit your floor plan: add, move, resize rooms and place devices." : "View your current home layout and device placements."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => setEditMode(!editMode)} variant={editMode ? "default" : "outline"}>
                {editMode ? <Eye className="mr-2 h-4 w-4" /> : <Edit className="mr-2 h-4 w-4" />}
                {editMode ? "View Mode" : "Edit Mode"}
              </Button>
              <Select value={selectedFloor} onValueChange={setSelectedFloor}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Select floor" />
                </SelectTrigger>
                <SelectContent>
                  {mockFloors.map(floor => <SelectItem key={floor} value={floor}>{floor}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {editMode && (
              <div className="flex gap-2 mt-2 sm:mt-0 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => setIsAddRoomModalOpen(true)}><PlusSquare className="mr-2 h-4 w-4" /> Add Room</Button>
                <Button variant="outline" size="sm" onClick={() => setIsAddDeviceModalOpen(true)}><Maximize className="mr-2 h-4 w-4" /> Add Device</Button>
                <Button variant="default" size="sm" onClick={handleSavePlan} disabled={isSavingPlan}>
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
                "relative w-full h-[400px] md:h-[500px] bg-muted/30 border-2 border-border rounded-lg flex items-center justify-center overflow-hidden p-2 shadow-inner",
                editMode && "border-dashed border-primary/50 cursor-grab",
                (draggingElementInfo || resizingRoomInfo) && "cursor-grabbing"
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
                        "absolute bg-primary/20 border border-primary rounded p-1 text-xs text-primary-foreground flex items-center justify-center shadow-md",
                        editMode && "cursor-grab hover:border-primary/80 hover:bg-primary/30 transition-all",
                        draggingElementInfo?.id === room.id && "opacity-70 ring-2 ring-primary z-10 shadow-lg",
                        resizingRoomInfo?.id === room.id && "opacity-70 ring-2 ring-accent z-10 shadow-lg"
                    )}
                    style={{
                        left: `${room.x}%`, top: `${room.y}%`,
                        width: `${room.width}%`, height: `${room.height}%`,
                    }}
                    onMouseDown={(e) => handleMouseDownShared(e, room.id, 'room')}
                >
                    <span className="truncate pointer-events-none">{room.name}</span>
                    {editMode && (
                        <>
                          <Tooltip>
                            <TooltipTrigger asChild>
                               <Button variant="ghost" size="icon" className="absolute -top-2 -right-2 h-5 w-5 bg-destructive/80 hover:bg-destructive text-destructive-foreground rounded-full p-0.5 z-20 shadow" onClick={(e) => { e.stopPropagation(); setFloorPlanRooms(prev => prev.filter(r => r.id !== room.id)); toast({title:"Room Removed", description: `${room.name} removed from plan.`})}}><Trash2 className="h-3 w-3"/></Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Delete {room.name}</p></TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                                <div
                                    className="absolute bottom-0 right-0 w-3 h-3 bg-accent rounded-sm cursor-se-resize border-2 border-background z-20 hover:scale-125 transition-transform shadow flex items-center justify-center"
                                    onMouseDown={(e) => handleResizeMouseDown(e, room.id)}
                                >
                                  <Move className="w-2 h-2 text-accent-foreground opacity-75" />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent><p>Resize {room.name}</p></TooltipContent>
                          </Tooltip>
                        </>
                    )}
                </div>
            ))}
             {floorPlanDevices.map(device => {
                const DeviceIconComponent = device.icon || Palette;
                return (
                    <div key={device.id}
                        className={cn(
                            "absolute flex flex-col items-center justify-center text-center p-1 bg-accent/30 border border-accent rounded-md shadow-sm z-5",
                            editMode && "cursor-grab hover:border-accent/80 hover:bg-accent/40 transition-all",
                            draggingElementInfo?.id === device.id && "opacity-70 ring-2 ring-accent z-10 shadow-lg"
                        )}
                         style={{ left: `${device.x}%`, top: `${device.y}%`, width: `${device.width}%`, height: `${device.height}%`}}
                         title={device.name}
                         onMouseDown={(e) => handleMouseDownShared(e, device.id, 'device')}
                    >
                        <DeviceIconComponent className="h-3/5 w-3/5 text-accent-foreground pointer-events-none"/>
                        <span className="text-[8px] md:text-[10px] text-accent-foreground truncate max-w-full block leading-tight pointer-events-none mt-0.5">{device.name.split(" ")[0]}</span>
                        {editMode &&
                          <Tooltip>
                            <TooltipTrigger asChild>
                               <Button variant="ghost" size="icon" className="absolute -top-1 -right-1 h-4 w-4 bg-destructive/80 hover:bg-destructive text-destructive-foreground rounded-full p-0.5 z-20 shadow" onClick={(e) => { e.stopPropagation(); setFloorPlanDevices(prev => prev.filter(d => d.id !== device.id)); toast({title:"Device Removed from Plan", description: `${device.name} removed.`})}}><Trash2 className="h-2 w-2"/></Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Remove {device.name}</p></TooltipContent>
                          </Tooltip>
                        }
                    </div>
                );
            })}
            {editMode && !draggingElementInfo && !resizingRoomInfo && (
                <p className="absolute bottom-2 left-2 text-xs text-muted-foreground bg-background/80 p-1 rounded shadow">Edit Mode: Drag rooms/devices. Resize rooms using bottom-right handle.</p>
            )}
             {(draggingElementInfo || resizingRoomInfo) && (
                 <p className="absolute bottom-2 left-2 text-xs text-primary bg-background/80 p-1 rounded font-semibold animate-pulse shadow">
                    {draggingElementInfo ? `Dragging ${draggingElementInfo.type}...` : "Resizing room..."}
                </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Room Modal */}
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

      {/* Add Device to Plan Modal */}
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
                                    onToggle={(isOn) => handleDeviceControlChange(device.id, "status", isOn)}
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
