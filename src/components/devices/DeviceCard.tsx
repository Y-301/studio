"use client";

import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Settings2, Palette, Volume2, Sun } from "lucide-react"; // Added Palette, Volume2, Sun
import React from "react";
import { Slider } from "@/components/ui/slider"; // Added Slider

interface DeviceCardProps {
  id: string;
  name: string;
  type: string;
  status: string;
  Icon: LucideIcon;
  room?: string; // Added room
  dataAiHint?: string;
  // Optional props for controllable devices
  brightness?: number;
  onBrightnessChange?: (value: number) => void;
  volume?: number;
  onVolumeChange?: (value: number) => void;
  color?: string;
  onColorChange?: () => void; // Placeholder for color picker modal
}

export function DeviceCard({ 
  id, 
  name, 
  type, 
  status, 
  Icon, 
  room, 
  dataAiHint,
  brightness,
  onBrightnessChange,
  volume,
  onVolumeChange,
  onColorChange
}: DeviceCardProps) {
  const [isOn, setIsOn] = React.useState(status === "On" || (type === "thermostat" && parseInt(status) > 0));

  const handleToggle = () => {
    if (type === "light" || type === "speaker" || type === "switch") { // Types that can be toggled on/off
      setIsOn(!isOn);
      // Here you would typically call an API to update the device state
      console.log(`Toggled device ${id} to ${!isOn ? "On" : "Off"}`);
    }
  };
  
  const isToggleable = type === "light" || type === "speaker" || type === "switch";

  return (
    <Card className="flex flex-col justify-between shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <Icon className="h-8 w-8 text-primary mb-2" />
          {isToggleable && (
            <Switch
              checked={isOn}
              onCheckedChange={handleToggle}
              aria-label={`Toggle ${name}`}
            />
          )}
        </div>
        <CardTitle className="text-lg">{name}</CardTitle>
        <CardDescription className="text-xs capitalize">
          {type} {room && ` - ${room}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-center items-start p-4 space-y-3">
        <div className="h-[120px] w-full bg-muted rounded-md mb-3 flex items-center justify-center">
            {/* Placeholder for actual device image or more complex status */}
            <img 
              src={`https://picsum.photos/seed/${id}/200/120`} 
              alt={name} 
              className="h-full w-full object-cover rounded-md"
              data-ai-hint={dataAiHint || type}
            />
        </div>
        <p className="text-sm font-semibold text-foreground self-center">
          Status: {type === "light" || type === "speaker" || type === "switch" ? (isOn ? "On" : "Off") : status}
        </p>

        {/* Controls for specific device types */}
        {type === "light" && brightness !== undefined && onBrightnessChange && isOn && (
          <div className="w-full space-y-1">
            <label htmlFor={`brightness-${id}`} className="text-xs text-muted-foreground flex items-center"><Sun className="mr-1 h-3 w-3" /> Brightness</label>
            <Slider id={`brightness-${id}`} defaultValue={[brightness]} max={100} step={1} onValueChange={(value) => onBrightnessChange(value[0])} />
          </div>
        )}
        {type === "light" && onColorChange && isOn && (
           <Button variant="outline" size="sm" className="w-full" onClick={onColorChange}>
              <Palette className="mr-2 h-4 w-4" /> Change Color
            </Button>
        )}

        {type === "speaker" && volume !== undefined && onVolumeChange && isOn && (
          <div className="w-full space-y-1">
            <label htmlFor={`volume-${id}`} className="text-xs text-muted-foreground flex items-center"><Volume2 className="mr-1 h-3 w-3" /> Volume</label>
            <Slider id={`volume-${id}`} defaultValue={[volume]} max={100} step={1} onValueChange={(value) => onVolumeChange(value[0])} />
          </div>
        )}
        
        <Button variant="ghost" size="sm" className="mt-2 text-muted-foreground hover:text-primary self-center">
          <Settings2 className="h-4 w-4 mr-1" />
          Configure
        </Button>
      </CardContent>
    </Card>
  );
}
