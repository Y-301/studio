
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DeviceCard, type Device } from "@/components/devices/DeviceCard"; 
import { PlusCircle, Lightbulb, Thermometer, Speaker, LayoutPanelLeft, Tv, Wind, Palette, Power, HardDrive, Loader2, AlertTriangle, Smartphone, Filter as FilterIcon, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/apiClient"; 

const deviceIconMap: { [key: string]: React.ElementType } = {
  light: Lightbulb,
  thermostat: Thermometer,
  blinds: LayoutPanelLeft,
  speaker: Speaker,
  sensor: HardDrive,
  tv: Tv,
  fan: Wind,
  switch: Power,
  other: Palette,
};

const deviceTypes = ["light", "thermostat", "blinds", "speaker", "sensor", "tv", "fan", "switch", "other"] as const;
const roomTypes = ["Living Room", "Bedroom", "Kitchen", "Office", "Bathroom", "Nursery", "Dining Room", "Exterior", "Hallway", "Unassigned"] as const;

const deviceFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, "Device name must be at least 3 characters."),
  type: z.enum(deviceTypes, { required_error: "Device type is required." }),
  room: z.enum(roomTypes, { required_error: "Room is required." }),
  status: z.string().optional(), 
  settings: z.any().optional(), 
  connectionDetails: z.string().optional(),
  dataAiHint: z.string().optional(),
});

type DeviceFormData = z.infer<typeof deviceFormSchema>;


export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | typeof deviceTypes[number]>("all");
  const [filterRoom, setFilterRoom] = useState<"all" | typeof roomTypes[number]>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const { toast } = useToast();

  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm<DeviceFormData>({
    resolver: zodResolver(deviceFormSchema),
  });

  const fetchDevices = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Backend uses MOCK_USER_ID 'user1' for now.
      const fetchedDevices = await apiClient<Device[]>('/devices');
      setDevices(fetchedDevices.map(d => ({...d, icon: deviceIconMap[d.type] || Palette })));
    } catch (err) {
      const errorMessage = (err as Error).message || "Failed to fetch devices.";
      setError(errorMessage);
      toast({ title: "Error Fetching Devices", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


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
    reset({ name: "", type: "light", room: "Unassigned", connectionDetails: "", status: "off", settings: { brightness: 50 } });
    setIsModalOpen(true);
  };

  const handleEditDevice = (device: Device) => {
    setEditingDevice(device);
    reset({
      id: device.id,
      name: device.name,
      type: device.type as any, 
      room: device.room as any, 
      status: device.status,
      settings: device.settings,
      connectionDetails: device.connectionDetails || `Mock Connection for ${device.name}`
    });
    setIsModalOpen(true);
  };

  const onSubmitForm = async (data: DeviceFormData) => {
    try {
      let responseDevice: Device;
      if (editingDevice && editingDevice.id) {
        const { id, ...updateData } = data;
        responseDevice = await apiClient<Device>(`/devices/${editingDevice.id}`, {
          method: 'PUT',
          body: JSON.stringify(updateData),
        });
        toast({ title: "Device Updated", description: `${responseDevice.name} has been updated.` });
      } else {
        const { id, ...createData } = data;
        if (!createData.status) {
            createData.status = createData.type === 'light' || createData.type === 'speaker' || createData.type === 'switch' || createData.type === 'fan' || createData.type === 'tv' ? "off" : (createData.type === 'thermostat' ? "20" : (createData.type === 'blinds' ? "closed" : "N/A"));
        }
        if (!createData.settings) {
            if (createData.type === 'light') createData.settings = { brightness: 50 };
            if (createData.type === 'speaker') createData.settings = { volume: 50 };
            if (createData.type === 'thermostat') createData.settings = { temperature: 20 };
        }
        responseDevice = await apiClient<Device>('/devices', {
          method: 'POST',
          body: JSON.stringify(createData),
        });
        toast({ title: "Device Added", description: `${responseDevice.name} has been added.` });
      }
      fetchDevices(); 
      setIsModalOpen(false);
      reset();
    } catch (err) {
      toast({ title: "Operation Failed", description: (err as Error).message, variant: "destructive" });
    }
  };

  const handleDeviceControlChange = async (deviceId: string, controlType: "brightness" | "volume" | "status" | "color", value: any) => {
     try {
        let payload: any = {};
        if (controlType === "status") {
            payload.status = value;
        } else if (controlType === "brightness") {
            payload.settings = { brightness: value };
            const currentDevice = devices.find(d => d.id === deviceId);
            if (value > 0 && currentDevice?.status.toLowerCase() === 'off') payload.status = 'on';
            else if (value === 0 && currentDevice?.type === 'light') payload.status = 'off';
        } else if (controlType === "volume") {
            payload.settings = { volume: value };
            const currentDevice = devices.find(d => d.id === deviceId);
            if (value > 0 && currentDevice?.status.toLowerCase() === 'off') payload.status = 'on';
        } else if (controlType === "color") {
            toast({title: "Change Color (Demo)", description: `Color change for device ${deviceId} to ${value} (not fully implemented via API).`});
            return; 
        }

        await apiClient<Device>(`/devices/${deviceId}/control`, {
            method: 'POST',
            body: JSON.stringify(payload),
        });
        // No toast here, as DeviceCard itself might show visual feedback. 
        // Or add a subtle success toast if preferred.
        fetchDevices(); 
     } catch (err) {
        toast({ title: "Control Failed", description: (err as Error).message, variant: "destructive" });
     }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Loading Devices...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-destructive p-4">
        <AlertTriangle className="h-12 w-12 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Error Fetching Devices</h2>
        <p className="text-center mb-4">{error}</p>
        <Button onClick={fetchDevices}><PlusCircle className="mr-2 h-4 w-4"/>Retry</Button>
      </div>
    );
  }


  return (
    <div className="space-y-8 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Device Management</h1>
          <p className="text-muted-foreground">
            Control and monitor all your smart home devices.
          </p>
        </div>
        <Button onClick={handleAddDevice} className="w-full md:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Device
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters & Search</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow md:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by device name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterType} onValueChange={(value) => setFilterType(value as "all" | typeof deviceTypes[number])}>
            <SelectTrigger className="w-full md:w-[180px]">
              <FilterIcon className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {deviceTypes.map(type => <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterRoom} onValueChange={(value) => setFilterRoom(value as "all" | typeof roomTypes[number])}>
            <SelectTrigger className="w-full md:w-[180px]">
               <FilterIcon className="mr-2 h-4 w-4" />
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
                  icon={device.icon || deviceIconMap[device.type] || Palette} 
                  room={device.room}
                  dataAiHint={device.dataAiHint}
                  brightness={device.settings?.brightness}
                  onBrightnessChange={(value) => handleDeviceControlChange(device.id, "brightness", value)}
                  volume={device.settings?.volume}
                  onVolumeChange={(value) => handleDeviceControlChange(device.id, "volume", value)}
                  onColorChange={device.type === 'light' ? () => toast({title: "Change Color (Demo)", description: `Color picker for ${device.name} would open.`}) : undefined}
                  onToggle={(isOn) => handleDeviceControlChange(device.id, "status", isOn ? "on" : "off")}
                  connectionDetails={device.connectionDetails}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Smartphone className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-xl font-semibold">No Devices Found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Try adjusting your filters or click "Add New Device" to add your first smart device.
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
          <form onSubmit={handleSubmit(onSubmitForm)} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input id="name" {...register("name")} className="col-span-3" placeholder="e.g., Living Room Lamp"/>
              {errors.name && <p className="col-span-4 text-right text-destructive text-xs">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">Type</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
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
                  <Select onValueChange={field.onChange} value={field.value}>
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingDevice ? "Save Changes" : "Add Device"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

