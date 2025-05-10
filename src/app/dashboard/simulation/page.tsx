
"use client";
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WakeUpSimulator } from "@/components/simulation/WakeUpSimulator";
import { DeviceCard, type Device } from '@/components/devices/DeviceCard'; // Import Device type
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SlidersHorizontal, Zap, House, Eye, Edit, PlusSquare, Trash2, Maximize, ChevronsUpDown, Lightbulb, Thermometer, Speaker, LayoutPanelLeft, MapPin, Palette } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { Slider } from "@/components/ui/slider";

// Mock devices for simulation - assume these are linked from the main devices page
const mockSimDevices: Device[] = [
  { id: "sim-light-1", name: "Living Room Main Light", type: "light", status: "Off", room: "Living Room", Icon: Lightbulb, dataAiHint: "ceiling light", brightness: 80, connectionDetails: "" },
  { id: "sim-thermo-1", name: "Living Room Thermostat", type: "thermostat", status: "20°C", room: "Living Room", Icon: Thermometer, dataAiHint: "smart thermostat", connectionDetails: "" },
  { id: "sim-speaker-1", name: "Kitchen Speaker", type: "speaker", status: "Paused", room: "Kitchen", Icon: Speaker, dataAiHint: "kitchen speaker", volume: 30, connectionDetails: "" },
  { id: "sim-blinds-1", name: "Bedroom Blinds", type: "blinds", status: "Closed", room: "Bedroom", Icon: LayoutPanelLeft, dataAiHint: "bedroom blinds", connectionDetails: "" },
  { id: "sim-unassigned-1", name: "New Sensor", type: "sensor", status: "Waiting", room: "Unassigned", Icon: Zap, dataAiHint: "iot sensor", connectionDetails: "" }
];

const initialMockRooms = ["Living Room", "Bedroom", "Kitchen", "Office", "Unassigned"];
const mockFloors = ["Ground Floor", "First Floor"];

interface FloorPlanRoom {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  devices: string[]; // IDs of devices in this room on the plan
}

interface FloorPlanDevice {
  id: string; // Corresponds to Device.id
  name: string;
  Icon: React.ElementType;
  x: number; // Relative to floor plan container
  y: number;
}


export default function SimulationPage() {
  const [editMode, setEditMode] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState(mockFloors[0]);
  const [selectedRoomTab, setSelectedRoomTab] = useState("All");
  const { toast } = useToast();

  const [floorPlanRooms, setFloorPlanRooms] = useState<FloorPlanRoom[]>([
    { id: "fp-lr", name: "Living Room", x: 10, y: 10, width: 30, height: 25, devices: ["sim-light-1", "sim-thermo-1"]},
    { id: "fp-k", name: "Kitchen", x: 45, y: 10, width: 20, height: 20, devices: ["sim-speaker-1"]},
    { id: "fp-br", name: "Bedroom", x: 10, y: 40, width: 25, height: 20, devices: ["sim-blinds-1"]},
  ]);
  const [floorPlanDevices, setFloorPlanDevices] = useState<FloorPlanDevice[]>([
    {id: "sim-light-1", name: "LR Light", Icon: Lightbulb, x: 15, y: 15},
    {id: "sim-thermo-1", name: "LR Thermo", Icon: Thermometer, x: 20, y: 20},
    {id: "sim-speaker-1", name: "Kitchen Spk", Icon: Speaker, x: 50, y: 15},
  ]);
  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [isAddDeviceModalOpen, setIsAddDeviceModalOpen] = useState(false);
  const [deviceToAddToPlan, setDeviceToAddToPlan] = useState<string | undefined>();


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
        x: Math.random() * 50 + 5, // Random position for demo
        y: Math.random() * 50 + 5,
        width: Math.random() * 15 + 15,
        height: Math.random() * 10 + 10,
        devices: [],
    };
    setFloorPlanRooms(prev => [...prev, newRoom]);
    toast({ title: "Room Added (Demo)", description: `${newRoomName} added to the floor plan.` });
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
        Icon: device.Icon,
        x: Math.random() * 70 + 5, // Random position for demo
        y: Math.random() * 70 + 5,
    };
    setFloorPlanDevices(prev => [...prev, newFPDevice]);
    toast({ title: "Device Added to Plan (Demo)", description: `${device.name} added.` });
    setIsAddDeviceModalOpen(false);
    setDeviceToAddToPlan(undefined);
  };
  
  const handleDeviceControlChange = (deviceId: string, controlType: "brightness" | "volume" | "status", value: any) => {
    // This function primarily affects the mockSimDevices if it were stateful.
    // For the visual floor plan, the state updates are handled in handleDeviceSimulationControl or similar.
    // Here, we'll just log and toast for the main device list part of the page.
    const device = mockSimDevices.find(d => d.id === deviceId);
    if(device) {
        // In a real app, you would update a state variable for mockSimDevices here.
        // For now, this is a conceptual update for DeviceCard interactions in the list below the floor plan.
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
        const updatedDevices = [...mockSimDevices];
        const deviceToUpdate = { ...updatedDevices[deviceIndex] };
        if (controlType === "brightness") deviceToUpdate.brightness = value;
        if (controlType === "volume") deviceToUpdate.volume = value;
        if (controlType === "status") deviceToUpdate.status = value ? "On" : "Off"; // Assuming boolean for status toggle
        // Note: This mockSimDevices update won't persist. In a real app, this would be handled by a central state or backend.
        console.log(`Sim: ${deviceId} ${controlType} changed to ${value}. (Local state only for demo)`);
        toast({ title: "Device Control (Sim Demo)", description: `${deviceToUpdate.name} ${controlType} set to ${value}`});

       setFloorPlanDevices(prev => prev.map(d => d.id === deviceId ? { ...d, name: deviceToUpdate.name, Icon: deviceToUpdate.Icon } : d));
        setFloorPlanRooms(prev => prev.map(r => r.id === deviceId ? { ...r, name: deviceToUpdate.name } : r));
    }
  };




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

          <div id="floor-plan-container" className="relative w-full h-[400px] md:h-[500px] bg-muted/50 border-2 border-dashed border-border rounded-lg flex items-center justify-center overflow-hidden p-2">
            {floorPlanRooms.length === 0 && floorPlanDevices.length === 0 && (
                 <div className="text-center text-muted-foreground p-4">
                    <ChevronsUpDown className="mx-auto h-12 w-12 mb-2" />
                    <p className="font-semibold">Floor Plan Area</p>
                    <p className="text-sm">{editMode ? "Use 'Add Room' or 'Add Device to Plan' to start." : "No elements on the floor plan."}</p>
                </div>
            )}
            {floorPlanRooms.map(room => (
                <div key={room.id}
                    className="absolute bg-primary/20 border border-primary rounded p-1 text-xs text-primary-foreground flex items-center justify-center cursor-grab"
                    style={{ 
                        left: `${room.x}%`, top: `${room.y}%`, 
                        width: `${room.width}%`, height: `${room.height}%`,
                        opacity: editMode ? 0.7 : 1,
                    }}
                    title={room.name}
                    // onClick={() => editMode && toast({title:"Room Selected (Demo)", description: `${room.name}`})} // Placeholder for selection
                >
                    {room.name}
                    {editMode && <Button variant="ghost" size="icon" className="absolute -top-2 -right-2 h-5 w-5 bg-destructive/80 hover:bg-destructive text-destructive-foreground rounded-full p-0.5" onClick={(e) => { e.stopPropagation(); setFloorPlanRooms(prev => prev.filter(r => r.id !== room.id)); toast({title:"Room Removed", description: `${room.name} removed.`})}}><Trash2 className="h-3 w-3"/></Button>}
                </div>
            ))}
             {floorPlanDevices.map(device => {
                const DeviceIconComponent = device.Icon || Palette;
                return (
                    <div key={device.id}
                        className="absolute flex flex-col items-center justify-center text-center cursor-grab p-1 bg-accent/30 border border-accent rounded-md shadow-sm"
                         style={{ left: `${device.x}%`, top: `${device.y}%`, opacity: editMode ? 0.8 : 1}}
                         title={device.name}
                        //  onClick={() => editMode && toast({title:"Device Selected (Demo)", description: `${device.name}`})} // Placeholder for selection
                    >
                        <DeviceIconComponent className="h-4 w-4 text-accent-foreground"/>
                        <span className="text-[10px] text-accent-foreground truncate max-w-[50px]">{device.name.split(" ")[0]}</span>
                        {editMode && <Button variant="ghost" size="icon" className="absolute -top-1 -right-1 h-4 w-4 bg-destructive/80 hover:bg-destructive text-destructive-foreground rounded-full p-0.5" onClick={(e) => { e.stopPropagation(); setFloorPlanDevices(prev => prev.filter(d => d.id !== device.id)); toast({title:"Device Removed from Plan", description: `${device.name} removed.`})}}><Trash2 className="h-2 w-2"/></Button>}
                    </div>
                );
            })}
            {editMode && (
                <p className="absolute bottom-2 left-2 text-xs text-muted-foreground bg-background/80 p-1 rounded">Edit Mode: Drag &amp; drop, resize (not implemented). Add/remove elements.</p>
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
                                    {...device} // This spreads all properties from device object
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
  );
}

