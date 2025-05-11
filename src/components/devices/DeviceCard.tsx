
"use client";

import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Settings2, Palette, Volume2, Sun, Zap, Power, Info } from "lucide-react"; // Added Zap, Power, Info
import React from "react";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast"; 
import { cn } from "@/lib/utils";

interface DeviceCardProps {
  id: string;
  name: string;
  type: string;
  status: string;
  icon: LucideIcon; // Now correctly typed as LucideIcon
  room?: string;
  dataAiHint?: string;
  brightness?: number;
  onBrightnessChange?: (value: number) => void;
  volume?: number;
  onVolumeChange?: (value: number) => void;
  color?: string;
  onColorChange?: () => void;
  onToggle?: (isOn: boolean) => void; 
  onSimulationBrightnessChange?: (value: number) => void; 
  onSimulationVolumeChange?: (value: number) => void; 
  connectionDetails?: string; 
  settings?: Record<string, any>; // To hold diverse settings like thermostat temp
}

export type Device = DeviceCardProps;

export function DeviceCard({ 
  id, 
  name, 
  type, 
  status, 
  icon: Icon, // Renamed prop to Icon for clarity
  room, 
  dataAiHint,
  brightness,
  onBrightnessChange,
  volume,
  onVolumeChange,
  onColorChange,
  onToggle,
  onSimulationBrightnessChange,
  onSimulationVolumeChange,
  settings,
}: DeviceCardProps) {
  const { toast } = useToast(); 
  
  // Determine initial on state based on type and status
  const getIsOn = (currentType: string, currentStatus: string) => {
    if (currentType === "thermostat") {
      return parseInt(currentStatus) > 0 && !isNaN(parseInt(currentStatus)); // Assuming temp > 0 means on
    }
    return currentStatus?.toLowerCase() === "on";
  };

  const [isOn, setIsOn] = React.useState(getIsOn(type, status));

  React.useEffect(() => {
    setIsOn(getIsOn(type, status));
  }, [status, type]);


  const handleToggleSwitch = () => {
    if (type === "light" || type === "speaker" || type === "switch" || type === "fan" || type === "tv") {
      const newIsOn = !isOn;
      setIsOn(newIsOn);
      if (onToggle) {
        onToggle(newIsOn);
      } else {
        console.log(`Toggled device ${id} to ${newIsOn ? "On" : "Off"}`);
        toast({ title: "Device Toggled (Demo)", description: `${name} turned ${newIsOn ? "On" : "Off"}` });
      }
    } else {
        toast({title: "Info", description: `Toggling for '${type}' type devices might be handled differently or not applicable directly via a simple switch.`})
    }
  };
  
  const isToggleable = type === "light" || type === "speaker" || type === "switch" || type === "fan" || type === "tv";

  const handleBrightnessSliderChange = onSimulationBrightnessChange || onBrightnessChange;
  const handleVolumeSliderChange = onSimulationVolumeChange || onVolumeChange;

  const displayStatus = () => {
    if (isToggleable) return isOn ? "On" : "Off";
    if (type === "thermostat" && settings?.temperature) return `${settings.temperature}°C`;
    if (type === "sensor" && settings?.last_reading && settings?.unit) return `${settings.last_reading}${settings.unit}`;
    return status;
  }

  return (
    <Card className={cn(
        "flex flex-col justify-between shadow-md hover:shadow-xl transition-shadow duration-300 group",
        isOn && (type === "light" || type === "speaker") && "bg-primary/10 dark:bg-primary/20 border-primary/30",
        isOn && type === "thermostat" && "bg-destructive/10 dark:bg-destructive/20 border-destructive/30" // Example for thermostat
      )}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <Icon className={cn("h-8 w-8 mb-2 group-hover:scale-110 transition-transform", isOn ? "text-primary" : "text-muted-foreground")} />
          {isToggleable && (
            <Switch
              checked={isOn}
              onCheckedChange={handleToggleSwitch}
              aria-label={`Toggle ${name}`}
            />
          )}
        </div>
        <CardTitle className="text-lg truncate" title={name}>{name}</CardTitle>
        <CardDescription className="text-xs capitalize">
          {type} {room && ` - ${room}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-end items-start p-4 pt-2 space-y-3">
        <p className={cn("text-sm font-semibold self-center", isOn ? "text-primary" : "text-muted-foreground")}>
          Status: {displayStatus()}
        </p>

        {type === "light" && brightness !== undefined && handleBrightnessSliderChange && isOn && (
          <div className="w-full space-y-1 pt-2">
            <label htmlFor={`brightness-${id}`} className="text-xs text-muted-foreground flex items-center"><Sun className="mr-1 h-3 w-3" /> Brightness: {brightness}%</label>
            <Slider id={`brightness-${id}`} defaultValue={[brightness]} max={100} step={1} onValueChange={(value) => handleBrightnessSliderChange(value[0])} />
          </div>
        )}
        {type === "light" && onColorChange && isOn && (
           <Button variant="outline" size="sm" className="w-full text-xs" onClick={onColorChange}>
              <Palette className="mr-2 h-3 w-3" /> Change Color
            </Button>
        )}

        {type === "speaker" && volume !== undefined && handleVolumeSliderChange && isOn && (
          <div className="w-full space-y-1 pt-2">
            <label htmlFor={`volume-${id}`} className="text-xs text-muted-foreground flex items-center"><Volume2 className="mr-1 h-3 w-3" /> Volume: {volume}%</label>
            <Slider id={`volume-${id}`} defaultValue={[volume]} max={100} step={1} onValueChange={(value) => handleVolumeSliderChange(value[0])} />
          </div>
        )}
        
        {/* Placeholder for other device type specific controls if needed */}
        {type === "thermostat" && (
            <div className="text-xs text-muted-foreground self-center">Target: {settings?.temperature}°C</div>
        )}
         {type === "blinds" && (
            <div className="text-xs text-muted-foreground self-center">Position: {settings?.position || 0}% open</div>
        )}


        <Button variant="ghost" size="sm" className="mt-auto text-muted-foreground hover:text-primary self-center text-xs" onClick={() => toast({title: `Configure ${name} (Demo)`, description:"Device specific configuration modal would open here."})}>
          <Settings2 className="h-3 w-3 mr-1" />
          Configure
        </Button>
      </CardContent>
    </Card>
  );
}

