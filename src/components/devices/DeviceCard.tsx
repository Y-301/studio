
"use client";

import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Settings2, Palette, Volume2, Sun } from "lucide-react";
import React from "react";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast"; 

interface DeviceCardProps {
  id: string;
  name: string;
  type: string;
  status: string;
  Icon: LucideIcon;
  room?: string;
  dataAiHint?: string;
  brightness?: number;
  onBrightnessChange?: (value: number) => void;
  volume?: number;
  onVolumeChange?: (value: number) => void;
  color?: string;
  onColorChange?: () => void;
  onToggle?: (isOn: boolean) => void; 
  onSimulationBrightnessChange?: (value: number) => void; // For simulation page
  onSimulationVolumeChange?: (value: number) => void; // For simulation page
  connectionDetails?: string; // Added to satisfy the Device type for simulation
}

export type Device = DeviceCardProps;

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
  onColorChange,
  onToggle,
  onSimulationBrightnessChange,
  onSimulationVolumeChange,
}: DeviceCardProps) {
  const { toast } = useToast(); 
  const isActuallyOn = type === "thermostat" ? parseInt(status) > 0 : status === "On";
  const [isOn, setIsOn] = React.useState(isActuallyOn);

  React.useEffect(() => {
    const newIsOn = type === "thermostat" ? parseInt(status) > 0 : status === "On";
    if (newIsOn !== isOn) {
        setIsOn(newIsOn);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    }
  };
  
  const isToggleable = type === "light" || type === "speaker" || type === "switch" || type === "fan" || type === "tv";

  const handleBrightnessSliderChange = onSimulationBrightnessChange || onBrightnessChange;
  const handleVolumeSliderChange = onSimulationVolumeChange || onVolumeChange;


  return (
    <Card className="flex flex-col justify-between shadow-md hover:shadow-xl transition-shadow duration-300 group">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <Icon className="h-8 w-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
          {isToggleable && (
            <Switch
              checked={isOn}
              onCheckedChange={handleToggleSwitch}
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
        <div 
            className="h-[120px] w-full bg-muted rounded-md mb-3 flex items-center justify-center"
            data-ai-hint={dataAiHint || type}
        >
            <span className="text-muted-foreground text-center p-2 text-sm">
                Visual for <br/> <strong className="capitalize">{type}</strong>: {name}
            </span>
        </div>
        <p className="text-sm font-semibold text-foreground self-center">
          Status: {isToggleable ? (isOn ? "On" : "Off") : status}
        </p>

        {type === "light" && brightness !== undefined && handleBrightnessSliderChange && isOn && (
          <div className="w-full space-y-1">
            <label htmlFor={`brightness-${id}`} className="text-xs text-muted-foreground flex items-center"><Sun className="mr-1 h-3 w-3" /> Brightness: {brightness}%</label>
            <Slider id={`brightness-${id}`} defaultValue={[brightness]} max={100} step={1} onValueChange={(value) => handleBrightnessSliderChange(value[0])} />
          </div>
        )}
        {type === "light" && onColorChange && isOn && (
           <Button variant="outline" size="sm" className="w-full" onClick={onColorChange}>
              <Palette className="mr-2 h-4 w-4" /> Change Color
            </Button>
        )}

        {type === "speaker" && volume !== undefined && handleVolumeSliderChange && isOn && (
          <div className="w-full space-y-1">
            <label htmlFor={`volume-${id}`} className="text-xs text-muted-foreground flex items-center"><Volume2 className="mr-1 h-3 w-3" /> Volume: {volume}%</label>
            <Slider id={`volume-${id}`} defaultValue={[volume]} max={100} step={1} onValueChange={(value) => handleVolumeSliderChange(value[0])} />
          </div>
        )}
        
        <Button variant="ghost" size="sm" className="mt-2 text-muted-foreground hover:text-primary self-center" onClick={() => toast({title: `Configure ${name} (Demo)`, description:"Device specific configuration would open."})}>
          <Settings2 className="h-4 w-4 mr-1" />
          Configure
        </Button>
      </CardContent>
    </Card>
  );
}
