"use client";
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WakeUpSimulator } from "@/components/simulation/WakeUpSimulator";
import { DeviceCard } from '@/components/devices/DeviceCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SlidersHorizontal, Zap, House, Eye, Edit, PlusSquare, Trash2, Maximize, ChevronsUpDown, Lightbulb, Thermometer, Speaker, LayoutPanelLeft } from "lucide-react";

// Mock devices for simulation - assume these are linked from the main devices page
const mockSimDevices = [
  { id: "sim-light-1", name: "Living Room Main Light", type: "light", status: "Off", room: "Living Room", icon: Lightbulb, dataAiHint: "ceiling light", brightness: 80 },
  { id: "sim-thermo-1", name: "Living Room Thermostat", type: "thermostat", status: "20°C", room: "Living Room", icon: Thermometer, dataAiHint: "smart thermostat" },
  { id: "sim-speaker-1", name: "Kitchen Speaker", type: "speaker", status: "Paused", room: "Kitchen", icon: Speaker, dataAiHint: "kitchen speaker", volume: 30 },
  { id: "sim-blinds-1", name: "Bedroom Blinds", type: "blinds", status: "Closed", room: "Bedroom", icon: LayoutPanelLeft, dataAiHint: "bedroom blinds" },
  { id: "sim-unassigned-1", name: "New Sensor", type: "sensor", status: "Waiting", room: "Unassigned", icon: Zap, dataAiHint: "iot sensor" }
];

const mockRooms = ["Living Room", "Bedroom", "Kitchen", "Office", "Unassigned"];
const mockFloors = ["Ground Floor", "First Floor"];


export default function SimulationPage() {
  const [editMode, setEditMode] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState(mockFloors[0]);
  const [selectedRoomTab, setSelectedRoomTab] = useState("All");

  const devicesForSelectedRoom = selectedRoomTab === "All" 
    ? mockSimDevices 
    : mockSimDevices.filter(d => d.room === selectedRoomTab);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">House & Wake-Up Simulation</h1>
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
                <Button variant="outline" size="sm"><PlusSquare className="mr-2 h-4 w-4" /> Add Room</Button>
                <Button variant="outline" size="sm"><Maximize className="mr-2 h-4 w-4" /> Add Device to Plan</Button>
              </div>
            )}
          </div>

          {/* Floor Plan Container Placeholder */}
          <div id="floor-plan-container" className="relative w-full h-[400px] md:h-[500px] bg-muted/50 border-2 border-dashed border-border rounded-lg flex items-center justify-center overflow-hidden">
            {/* This is where the visual floor plan would be rendered */}
            <div className="text-center text-muted-foreground p-4">
              <ChevronsUpDown className="mx-auto h-12 w-12 mb-2" />
              <p className="font-semibold">Floor Plan Area</p>
              <p className="text-sm">{editMode ? "Drag to move, resize handles will appear on selection." : "Interactive floor plan visualization."}</p>
              {/* Example of a "room" and "device" for visual cue - these would be dynamic */}
              <div className="absolute top-10 left-10 w-32 h-24 bg-primary/20 border border-primary rounded p-1 text-xs text-primary-foreground opacity-50">
                Living Room
                <div className="absolute bottom-1 right-1 h-4 w-4 bg-accent rounded-full" title="Simulated Light"></div>
              </div>
               <div className="absolute top-1/2 left-1/2 w-24 h-20 bg-secondary/30 border border-secondary-foreground rounded p-1 text-xs text-secondary-foreground opacity-50 transform -translate-x-1/2 -translate-y-1/2">
                Kitchen
              </div>
               {editMode && (
                <p className="absolute bottom-4 text-xs">Edit Mode Tools: Click room to select. Drag to move. Resize handles will appear.</p>
               )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>Device Controls by Room ({selectedFloor})</CardTitle>
            <CardDescription>Interact with devices based on the selected room in your simulation.</CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs value={selectedRoomTab} onValueChange={setSelectedRoomTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 mb-4">
                    <TabsTrigger value="All">All</TabsTrigger>
                    {mockRooms.map(room => (
                        <TabsTrigger key={room} value={room}>{room}</TabsTrigger>
                    ))}
                </TabsList>
                 <TabsContent value={selectedRoomTab} className="mt-0"> {/* Reuse value to avoid re-render */}
                    {devicesForSelectedRoom.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {devicesForSelectedRoom.map(device => (
                                <DeviceCard 
                                    key={device.id}
                                    {...device}
                                    onBrightnessChange={(value) => console.log(`Sim: ${device.id} brightness ${value}`)}
                                    onVolumeChange={(value) => console.log(`Sim: ${device.id} volume ${value}`)}
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
