"use client";

import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";
import React from "react";
import Image from "next/image";

interface DeviceCardProps {
  id: string;
  name: string;
  type: string;
  status: string;
  Icon: LucideIcon;
  dataAiHint?: string;
}

export function DeviceCard({ id, name, type, status, Icon, dataAiHint }: DeviceCardProps) {
  const [isOn, setIsOn] = React.useState(status === "On" || (type === "thermostat" && parseInt(status) > 0));

  const handleToggle = () => {
    if (type === "light" || type === "speaker") { // Types that can be toggled on/off
      setIsOn(!isOn);
      // Here you would typically call an API to update the device state
      console.log(`Toggled device ${id} to ${!isOn ? "On" : "Off"}`);
    }
  };
  
  const isToggleable = type === "light" || type === "speaker";

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
        <CardDescription className="text-xs capitalize">{type}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-center items-center">
        <Image 
            src={`https://picsum.photos/seed/${id}/200/150`} 
            alt={name}
            width={200}
            height={150}
            className="rounded-md mb-3 object-cover aspect-[4/3]"
            data-ai-hint={dataAiHint || type}
        />
        <p className="text-sm font-semibold text-foreground">
          {type === "light" || type === "speaker" ? (isOn ? "On" : "Off") : status}
        </p>
        <Button variant="ghost" size="sm" className="mt-2 text-muted-foreground hover:text-primary">
          <Settings2 className="h-4 w-4 mr-1" />
          Configure
        </Button>
      </CardContent>
    </Card>
  );
}
