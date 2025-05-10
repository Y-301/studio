
"use client";
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WakeUpSimulator } from "@/components/simulation/WakeUpSimulator";
import { DeviceCard, type Device } from '@/components/devices/DeviceCard'; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SlidersHorizontal, Zap, House, Eye, Edit, PlusSquare, Trash2, Maximize, ChevronsUpDown, Lightbulb, Thermometer, Speaker, LayoutPanelLeft, MapPin, Palette, GripVertical } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { Slider } from "@/components/ui/slider";
import { cn } from '@/lib/utils';

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

const MIN_ROOM_SIZE_PERCENT = 10; // Minimum 10% width/height for rooms
const DEVICE_ICON_SIZE_PERCENT = 5; // Approx size for device icons on plan


export default function SimulationPage() {
  const [editMode, setEditMode] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState(mockFloors[0]);
  const [selectedRoomTab, setSelectedRoomTab] = useState("All");
  const { toast } = useToast();
  const floorPlanRef = useRef<HTMLDivElement>(null);

  const [floorPlanRooms, setFloorPlanRooms] = useState<FloorPlanRoom[]>([
    { id: "fp-lr", name: "Living Room", x: 10, y: 10, width: 35, height: 30, devices: ["sim-light-1", "sim-thermo-1"]},
    { id: "fp-k", name: "Kitchen", x: 50, y: 10, width: 25, height: 25, devices: ["sim-speaker-1"]},
    { id: "fp-br", name: "Bedroom", x: 10, y: 45, width: 30, height: 25, devices: ["sim-blinds-1"]},
  ]);
  const [floorPlanDevices, setFloorPlanDevices] = useState<FloorPlanDevice[]>([
    {id: "sim-light-1", name: "LR Light", icon: Lightbulb, x: 15, y: 15, width: DEVICE_ICON_SIZE_PERCENT, height: DEVICE_ICON_SIZE_PERCENT},
    {id: "sim-thermo-1", name: "LR Thermo", icon: Thermometer, x: 20, y: 20, width: DEVICE_ICON_SIZE_PERCENT, height: DEVICE_ICON_SIZE_PERCENT},
    {id: "sim-speaker-1", name: "Kitchen Spk", icon: Speaker, x: 55, y: 15, width: DEVICE_ICON_SIZE_PERCENT, height: DEVICE_ICON_SIZE_PERCENT},
  ]);
  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [isAddDeviceModalOpen, setIsAddDeviceModalOpen] = useState(false);
  const [deviceToAddToPlan, setDeviceToAddToPlan] = useState<string | undefined>();

  const [draggingElementInfo, setDraggingElementInfo] = useState<DraggingInfo | null>(null);
  const [resizingRoomInfo, setResizingRoomInfo] = useState<ResizingInfo | null>(null);


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
    const device = mockSimDevices.find(d => d.id === deviceId);
    if(device) {
        let statusMessage = `${device.name} ${controlType} set to ${value}`;
        if (controlType === "status") {
            statusMessage = `${device.name} turned ${value ? "On" : "Off"}`;
        }
        toast({ title: "Device Control (List Demo)", description: statusMessage });
    }
  };

   const handleDeviceSimulationControl = (deviceId: string, controlType: "brightness" | "volume" | "status", value: any) => {
    const deviceIndex = mockSimDevices.findIndex(d => d.id === deviceId);
    if (deviceIndex !== -1) {
        const updatedDevice = { ...mockSimDevices[deviceIndex] };
        if (controlType === "brightness") updatedDevice.brightness = value;
        if (controlType === "volume") updatedDevice.volume = value;
        if (controlType === "status") updatedDevice.status = value ? "On" : "Off"; // Assuming value is boolean for toggle
        
        // This is a mock update. In a real app, `mockSimDevices` would be stateful.
        // For now, we're just logging and toasting.
        console.log(`Sim (Mock): ${deviceId} ${controlType} changed to ${value}.`);
        toast({ title: "Device Control (Sim)", description: `${updatedDevice.name} ${controlType} set to ${value}`});
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

        // Boundary checks
        newX = Math.max(0, Math.min(newX, 100 - draggingElementInfo.elementWidthPercent));
        newY = Math.max(0, Math.min(newY, 100 - draggingElementInfo.elementHeightPercent));

        if (draggingElementInfo.type === 'room') {
          const updatedRoom: FloorPlanRoom = {
            ...floorPlanRooms.find(r => r.id === draggingElementInfo.id)!,
            x: newX,
            y: newY,
          };
          if (!checkRoomCollision(updatedRoom, floorPlanRooms)) {
            setFloorPlanRooms(prev => prev.map(r => r.id === draggingElementInfo.id ? updatedRoom : r));
          }
        } else { // device
          setFloorPlanDevices(prev => prev.map(d => d.id === draggingElementInfo.id ? { ...d, x: newX, y: newY } : d));
        }
      } else if (resizingRoomInfo) {
        const room = floorPlanRooms.find(r => r.id === resizingRoomInfo.id);
        if (!room) return;

        let newWidth = resizingRoomInfo.initialWidthPercent + (mouseXPercent - resizingRoomInfo.startMouseXPercent);
        let newHeight = resizingRoomInfo.initialHeightPercent + (mouseYPercent - resizingRoomInfo.startMouseYPercent);

        // Min size and boundary checks
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
  }, [draggingElementInfo, resizingRoomInfo, floorPlanRooms, floorPlanDevices, editMode]);


  return (
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
            <div className="flex gap-2">
              <Button onClick={() => setEditMode(!editMode)} variant={editMode ? "default" : "outline"}>
                {editMode ? <Eye className="mr-2 h-4 w-4" /> : <Edit className="mr-2 h-4 w-4" />}
                {editMode ? "View Mode" : "Edit Mode"}
              </Button>
              <Select value={selectedFloor} onValueChange={setSelectedFloor}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select floor" />
                </SelectTrigger>
                <SelectContent>
                  {mockFloors.map(floor => <SelectItem key={floor} value={floor}>{floor}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {editMode && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsAddRoomModalOpen(true)}><PlusSquare className="mr-2 h-4 w-4" /> Add Room</Button>
                <Button variant="outline" size="sm" onClick={() => setIsAddDeviceModalOpen(true)}><Maximize className="mr-2 h-4 w-4" /> Add Device to Plan</Button>
              </div>
            )}
          </div>

          <div 
            id="floor-plan-container" 
            ref={floorPlanRef}
            className={cn(
                "relative w-full h-[400px] md:h-[500px] bg-muted/30 border-2 border-border rounded-lg flex items-center justify-center overflow-hidden p-2",
                editMode && "border-dashed border-primary/50 cursor-grab",
                (draggingElementInfo || resizingRoomInfo) && "cursor-grabbing"
            )}
            style={{
                 backgroundImage: editMode ? 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(to right, var(--border) 1px, transparent 1px)' : 'none',
                 backgroundSize: editMode ? '20px 20px' : 'auto',
            }}
          >
            {floorPlanRooms.length === 0 && floorPlanDevices.length === 0 && (
                 <div className="text-center text-muted-foreground p-4">
                    <ChevronsUpDown className="mx-auto h-12 w-12 mb-2" />
                    <p className="font-semibold">Floor Plan Area</p>
                    <p className="text-sm">{editMode ? "Use 'Add Room' or 'Add Device to Plan' to start." : "No elements on the floor plan."}</p>
                </div>
            )}
            {floorPlanRooms.map(room => (
                <div key={room.id}
                    className={cn(
                        "absolute bg-primary/20 border border-primary rounded p-1 text-xs text-primary-foreground flex items-center justify-center",
                        editMode && "cursor-grab hover:border-primary/80 hover:bg-primary/30 transition-all",
                        draggingElementInfo?.id === room.id && "opacity-70 ring-2 ring-primary z-10",
                        resizingRoomInfo?.id === room.id && "opacity-70 ring-2 ring-accent z-10"
                    )}
                    style={{ 
                        left: `${room.x}%`, top: `${room.y}%`, 
                        width: `${room.width}%`, height: `${room.height}%`,
                    }}
                    title={room.name}
                    onMouseDown={(e) => handleMouseDownShared(e, room.id, 'room')}
                >
                    {room.name}
                    {editMode && (
                        <>
                            <Button variant="ghost" size="icon" className="absolute -top-2 -right-2 h-5 w-5 bg-destructive/80 hover:bg-destructive text-destructive-foreground rounded-full p-0.5 z-20" onClick={(e) => { e.stopPropagation(); setFloorPlanRooms(prev => prev.filter(r => r.id !== room.id)); toast({title:"Room Removed", description: `${room.name} removed from plan.`})}}><Trash2 className="h-3 w-3"/></Button>
                            <div 
                                className="absolute bottom-0 right-0 w-3 h-3 bg-accent rounded-full cursor-se-resize border-2 border-background z-20 hover:scale-125 transition-transform"
                                onMouseDown={(e) => handleResizeMouseDown(e, room.id)}
                                title={`Resize ${room.name}`}
                            >
                              <GripVertical className="w-2 h-2 text-accent-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-50" />
                            </div>
                        </>
                    )}
                </div>
            ))}
             {floorPlanDevices.map(device => {
                const DeviceIconComponent = device.icon || Palette;
                return (
                    <div key={device.id}
                        className={cn(
                            "absolute flex flex-col items-center justify-center text-center p-1 bg-accent/30 border border-accent rounded-md shadow-sm z-5", // Ensure devices are above rooms but below dragging element
                            editMode && "cursor-grab hover:border-accent/80 hover:bg-accent/40 transition-all",
                            draggingElementInfo?.id === device.id && "opacity-70 ring-2 ring-accent z-10"
                        )}
                         style={{ left: `${device.x}%`, top: `${device.y}%`, width: `${device.width}%`, height: `${device.height}%`}}
                         title={device.name}
                         onMouseDown={(e) => handleMouseDownShared(e, device.id, 'device')}
                    >
                        <DeviceIconComponent className="h-3/4 w-3/4 text-accent-foreground"/>
                        <span className="text-[8px] md:text-[10px] text-accent-foreground truncate max-w-full block leading-tight">{device.name.split(" ")[0]}</span>
                        {editMode && <Button variant="ghost" size="icon" className="absolute -top-1 -right-1 h-4 w-4 bg-destructive/80 hover:bg-destructive text-destructive-foreground rounded-full p-0.5 z-20" onClick={(e) => { e.stopPropagation(); setFloorPlanDevices(prev => prev.filter(d => d.id !== device.id)); toast({title:"Device Removed from Plan", description: `${device.name} removed.`})}}><Trash2 className="h-2 w-2"/></Button>}
                    </div>
                );
            })}
            {editMode && !draggingElementInfo && !resizingRoomInfo && (
                <p className="absolute bottom-2 left-2 text-xs text-muted-foreground bg-background/80 p-1 rounded">Edit Mode: Drag rooms/devices. Resize rooms using bottom-right handle.</p>
            )}
             {(draggingElementInfo || resizingRoomInfo) && (
                 <p className="absolute bottom-2 left-2 text-xs text-primary bg-background/80 p-1 rounded font-semibold animate-pulse">
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
            <Input id="new-room-name" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} />
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
                    {mockSimDevices.filter(d => !floorPlanDevices.find(fpd => fpd.id === d.id)).map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.name} ({d.type})</SelectItem>
                    ))}
                    {mockSimDevices.filter(d => !floorPlanDevices.find(fpd => fpd.id === d.id)).length === 0 && <p className="p-2 text-sm text-muted-foreground">All devices added.</p>}
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
                <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 mb-4">
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
  );
}
