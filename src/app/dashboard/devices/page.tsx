
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DeviceCard } from "@/components/devices/DeviceCard";
import { PlusCircle, Lightbulb, Thermometer, LayoutPanelTop, Speaker, Smartphone } from "lucide-react";

// Mock device data
const devices = [
  { id: "1", name: "Living Room Lamp", type: "light", status: "On", icon: Lightbulb, dataAiHint: "lamp light" },
  { id: "2", name: "Bedroom Thermostat", type: "thermostat", status: "22°C", icon: Thermometer, dataAiHint: "thermostat control" },
  { id: "3", name: "Kitchen Blinds", type: "blinds", status: "50% Open", icon: LayoutPanelTop, dataAiHint: "window blinds" },
  { id: "4", name: "Office Speaker", type: "speaker", status: "Paused", icon: Speaker, dataAiHint: "bluetooth speaker" },
  { id: "5", name: "Outdoor Lights", type: "light", status: "Off", icon: Lightbulb, dataAiHint: "outdoor lighting" },
  { id: "6", name: "Nursery Temp Sensor", type: "sensor", status: "21°C", icon: Thermometer, dataAiHint: "temperature sensor" },
];

export default function DevicesPage() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Device Management</h1>
          <p className="text-muted-foreground">
            Control and monitor all your smart home devices.
          </p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Device
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Devices ({devices.length})</CardTitle>
          <CardDescription>Click on a device to see more options or toggle its state.</CardDescription>
        </CardHeader>
        <CardContent>
          {devices.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {devices.map((device) => (
                <DeviceCard
                  key={device.id}
                  id={device.id}
                  name={device.name}
                  type={device.type}
                  status={device.status}
                  Icon={device.icon}
                  dataAiHint={device.dataAiHint}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Smartphone className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-xl font-semibold">No Devices Found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Get started by adding your first smart device.
              </p>
              <Button className="mt-4">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Device
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

