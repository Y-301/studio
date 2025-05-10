"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DeviceCard } from "@/components/devices/DeviceCard";
import { PlusCircle, Lightbulb, Thermometer, Speaker, LayoutPanelLeft, Tv, Wind, Palette } from "lucide-react"; // Replaced VenetianBlind with LayoutPanelLeft, added Tv, Wind
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Mock device data with room and control properties
const initialDevices = [
  { id: "1", name: "Living Room Lamp", type: "light", status: "On", room: "Living Room", icon: Lightbulb, dataAiHint: "lamp light", brightness: 70 },
  { id: "2", name: "Bedroom Thermostat", type: "thermostat", status: "22°C", room: "Bedroom", icon: Thermometer, dataAiHint: "thermostat control" },
  { id: "3", name: "Kitchen Blinds", type: "blinds", status: "50% Open", room: "Kitchen", icon: LayoutPanelLeft, dataAiHint: "window blinds" },
  { id: "4", name: "Office Speaker", type: "speaker", status: "Paused", room: "Office", icon: Speaker, dataAiHint: "bluetooth speaker", volume: 50 },
  { id: "5", name: "Outdoor Lights", type: "light", status: "Off", room: "Exterior", icon: Lightbulb, dataAiHint: "outdoor lighting", brightness: 100 },
  { id: "6", name: "Nursery Temp Sensor", type: "sensor", status: "21°C", room: "Nursery", icon: Thermometer, dataAiHint: "temperature sensor" },
  { id: "7", name: "Smart TV", type: "tv", status: "Off", room: "Living Room", icon: Tv, dataAiHint: "smart television" },
  { id: "8", name: "Ceiling Fan", type: "fan", status: "Medium", room: "Bedroom", icon: Wind, dataAiHint: "ceiling fan" },
];

const deviceTypes = ["light", "thermostat", "blinds", "speaker", "sensor", "tv", "fan", "switch", "other"];
const roomTypes = ["Living Room", "Bedroom", "Kitchen", "Office", "Bathroom", "Nursery", "Dining Room", "Exterior", "Hallway"];

const deviceFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, "Device name must be at least 3 characters."),
  type: z.enum(deviceTypes as [string, ...string[]], { required_error: "Device type is required." }),
  room: z.enum(roomTypes as [string, ...string[]], { required_error: "Room is required." }),
  connectionDetails: z.string().optional(), // Example: IP address, MAC, etc.
});

type DeviceFormData = z.infer<typeof deviceFormSchema>;

export default function DevicesPage() {
  const [devices, setDevices] = useState(initialDevices);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterRoom, setFilterRoom] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<DeviceFormData | null>(null);

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<DeviceFormData>({
    resolver: zodResolver(deviceFormSchema),
  });

  const filteredDevices = useMemo(() => {
    return devices.filter(device => {
      const matchesSearch = device.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === "all" || device.type === filterType;
      const matchesRoom = filterRoom === "all" || device.room === filterRoom;
      return matchesSearch && matchesType && matchesRoom;
    });
  }, [devices, searchTerm, filterType, filterRoom]);

  const handleAddDevice = () => {
    setEditingDevice(null);
    reset({ name: "", type: undefined, room: undefined, connectionDetails: "" });
    setIsModalOpen(true);
  };

  const handleEditDevice = (device: (typeof devices)[0]) => {
    setEditingDevice(device as DeviceFormData); // Cast for form
    reset({
      id: device.id,
      name: device.name,
      type: device.type as any, // Bypassing enum check for existing valid types
      room: device.room as any,
      connectionDetails: `Mock Connection for ${device.name}`
    });
    setIsModalOpen(true);
  };
  
  const onSubmit = (data: DeviceFormData) => {
    if (editingDevice && editingDevice.id) {
      // Update existing device
      setDevices(prev => prev.map(d => d.id === editingDevice.id ? { ...d, ...data, icon: d.icon } : d));
    } else {
      // Add new device
      const newDevice = { 
        ...data, 
        id: String(Date.now()), 
        status: data.type === 'light' || data.type === 'speaker' ? "Off" : "N/A", 
        icon: Lightbulb, // Default icon, could be dynamic
        dataAiHint: data.type
      };
      setDevices(prev => [...prev, newDevice as any]); // Cast for now
    }
    setIsModalOpen(false);
    reset();
  };
  
  const handleBrightnessChange = (deviceId: string, value: number) => {
    console.log(`Device ${deviceId} brightness changed to ${value}`);
    // Mock update, in real app update state and call API
  };
  const handleVolumeChange = (deviceId: string, value: number) => {
     console.log(`Device ${deviceId} volume changed to ${value}`);
  };
   const handleColorChange = (deviceId: string) => {
     console.log(`Device ${deviceId} color change requested`);
     // Open color picker modal / logic
   };


  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Device Management</h1>
          <p className="text-muted-foreground">
            Control and monitor all your smart home devices.
          </p>
        </div>
        <Button onClick={handleAddDevice}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Device
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters & Search</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4">
          <Input
            placeholder="Search by device name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {deviceTypes.map(type => <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterRoom} onValueChange={setFilterRoom}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by room" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rooms</SelectItem>
              {roomTypes.map(room => <SelectItem key={room} value={room}>{room}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Devices ({filteredDevices.length})</CardTitle>
          <CardDescription>Click on a device to see more options or toggle its state.</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredDevices.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredDevices.map((device) => (
                <DeviceCard
                  key={device.id}
                  id={device.id}
                  name={device.name}
                  type={device.type}
                  status={device.status}
                  Icon={device.icon}
                  room={device.room}
                  dataAiHint={device.dataAiHint}
                  brightness={device.type === 'light' ? (device as any).brightness : undefined}
                  onBrightnessChange={(value) => handleBrightnessChange(device.id, value)}
                  volume={device.type === 'speaker' ? (device as any).volume : undefined}
                  onVolumeChange={(value) => handleVolumeChange(device.id, value)}
                  onColorChange={device.type === 'light' ? () => handleColorChange(device.id) : undefined}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Speaker className="mx-auto h-12 w-12 text-muted-foreground" /> {/* Changed icon */}
              <h3 className="mt-2 text-xl font-semibold">No Devices Found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Try adjusting your filters or add your first smart device.
              </p>
              <Button className="mt-4" onClick={handleAddDevice}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Device
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingDevice ? "Edit Device" : "Add New Device"}</DialogTitle>
            <DialogDescription>
              {editingDevice ? "Update the details of your device." : "Fill in the details to add a new smart device."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input id="name" {...register("name")} className="col-span-3" />
              {errors.name && <p className="col-span-4 text-right text-destructive text-xs">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">Type</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger id="type" className="col-span-3">
                      <SelectValue placeholder="Select device type" />
                    </SelectTrigger>
                    <SelectContent>
                      {deviceTypes.map(type => <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.type && <p className="col-span-4 text-right text-destructive text-xs">{errors.type.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="room" className="text-right">Room</Label>
               <Controller
                name="room"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger id="room" className="col-span-3">
                      <SelectValue placeholder="Select room" />
                    </SelectTrigger>
                    <SelectContent>
                      {roomTypes.map(room => <SelectItem key={room} value={room}>{room}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.room && <p className="col-span-4 text-right text-destructive text-xs">{errors.room.message}</p>}
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="connectionDetails" className="text-right">Connection</Label>
              <Input id="connectionDetails" {...register("connectionDetails")} placeholder="e.g. IP, MAC, Cloud ID" className="col-span-3" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit">{editingDevice ? "Save Changes" : "Add Device"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
