
"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Watch, Activity, BatteryFull, Wifi, LinkIcon, Heart, Footprints, Bed, Bell, Settings as SettingsIcon, Save, MessageSquare } from "lucide-react"; // Added icons
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { useToast } from "@/hooks/use-toast";

const chartConfig = {
  value: {
    label: "Value",
  },
  hr: {
    label: "Heart Rate",
    color: "hsl(var(--destructive))",
  },
  steps: {
    label: "Steps",
    color: "hsl(var(--primary))",
  },
  sleep: {
    label: "Sleep (hrs)",
    color: "hsl(var(--accent))",
  },
} satisfies ChartConfig;

const mockHrData = [
  { time: "12AM", hr: 65 }, { time: "3AM", hr: 60 }, { time: "6AM", hr: 70 }, 
  { time: "9AM", hr: 75 }, { time: "12PM", hr: 80 }, { time: "3PM", hr: 78 },
  { time: "6PM", hr: 82 }, { time: "9PM", hr: 70 },
];
const mockActivityData = [
  { day: "Mon", steps: 8000 }, { day: "Tue", steps: 12000 }, { day: "Wed", steps: 7500 },
  { day: "Thu", steps: 9200 }, { day: "Fri", steps: 15000 }, { day: "Sat", steps: 6000 },
  { day: "Sun", steps: 11000 },
];
const mockSleepData = [
 { day: "Mon", sleep: 7.5 }, { day: "Tue", sleep: 6.8 }, { day: "Wed", sleep: 8.1 },
 { day: "Thu", sleep: 7.2 }, { day: "Fri", sleep: 6.5 }, { day: "Sat", sleep: 9.0 },
 { day: "Sun", sleep: 7.8 },
];


export default function WristbandPage() {
  const { toast } = useToast();
  const [wristbandConnected, setWristbandConnected] = useState(true); // Mock status
  const [batteryLevel, setBatteryLevel] = useState(87);
  const [firmwareVersion, setFirmwareVersion] = useState("1.3.2");
  const [lastSync, setLastSync] = useState("2 mins ago");
  const [currentHeartRate, setCurrentHeartRate] = useState(72);
  const [stepsToday, setStepsToday] = useState(5873);
  const [lastNightSleep, setLastNightSleep] = useState("7h 45m");

  // Settings states
  const [notificationsCall, setNotificationsCall] = useState(true);
  const [notificationsSms, setNotificationsSms] = useState(true);
  const [notificationsApps, setNotificationsApps] = useState(false);
  const [continuousHr, setContinuousHr] = useState(true);
  const [autoSleepTracking, setAutoSleepTracking] = useState(true);
  const [inactivityAlert, setInactivityAlert] = useState(true);
  
  const [feedbackMessage, setFeedbackMessage] = useState<{type: 'success' | 'error' | 'info', text: string} | null>(null);


  const handleSyncNow = () => {
    setFeedbackMessage({type: 'info', text: 'Syncing wristband data...'});
    setTimeout(() => {
      setLastSync("Just now");
      setCurrentHeartRate(Math.floor(Math.random() * 20) + 65); // Randomize HR a bit
      setStepsToday(stepsToday + Math.floor(Math.random() * 500));
      setFeedbackMessage({type: 'success', text: 'Wristband synced successfully!'});
      toast({title: "Sync Complete", description: "Wristband data has been updated."});
    }, 2000);
  };

  const handleDisconnect = () => {
    setFeedbackMessage({type: 'info', text: 'Disconnecting wristband...'});
    setTimeout(() => {
      setWristbandConnected(false);
      setFeedbackMessage({type: 'success', text: 'Wristband disconnected.'});
       toast({title: "Wristband Disconnected", variant: "destructive"});
    }, 1500);
  };
  
  const handleConnect = () => {
    setFeedbackMessage({type: 'info', text: 'Connecting to wristband...'});
    setTimeout(() => {
      setWristbandConnected(true);
      setFeedbackMessage({type: 'success', text: 'Wristband connected successfully!'});
      toast({title: "Wristband Connected"});
    }, 2000);
  };

  const handleSaveSettings = () => {
     setFeedbackMessage({type: 'info', text: 'Saving settings...'});
    // Mock save action
    console.log({ notificationsCall, notificationsSms, notificationsApps, continuousHr, autoSleepTracking, inactivityAlert });
    setTimeout(() => {
        setFeedbackMessage({type: 'success', text: 'Wristband settings saved!'});
        toast({title: "Settings Saved", description: "Your wristband preferences have been updated."});
    }, 1000);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Wristband Management</h1>
          <p className="text-muted-foreground">
            Connect, manage, and view insights from your WakeSync compatible wristband.
          </p>
        </div>
        <Watch className="h-24 w-24 text-primary opacity-50 hidden md:block" data-ai-hint="smart watch" />
      </div>

      {feedbackMessage && (
        <div className={`p-3 rounded-md text-sm ${
            feedbackMessage.type === 'success' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700' :
            feedbackMessage.type === 'error' ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700' :
            'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
        }`}>
            <MessageSquare className="inline h-4 w-4 mr-2"/>{feedbackMessage.text}
        </div>
      )}

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Watch className="h-6 w-6 text-primary" />
            {wristbandConnected ? "WakeSync Band X1" : "No Wristband Connected"}
          </CardTitle>
          <CardDescription>
            {wristbandConnected
              ? `Status: Connected | Firmware: v${firmwareVersion}`
              : "Connect your wristband to track sleep, activity, and enhance your wake-up experience."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {wristbandConnected ? (
            <div className="space-y-6">
                <div className="grid md:grid-cols-3 gap-4">
                    <Card className="p-4 text-center">
                        <BatteryFull className={`h-8 w-8 mx-auto mb-2 ${batteryLevel > 20 ? 'text-green-500' : 'text-red-500'}`}/>
                        <p className="font-semibold">Battery</p>
                        <p className="text-lg">{batteryLevel}%</p>
                    </Card>
                     <Card className="p-4 text-center">
                        <Wifi className="h-8 w-8 mx-auto text-primary mb-2"/>
                        <p className="font-semibold">Connection</p>
                        <p className="text-lg">Bluetooth LE</p>
                    </Card>
                     <Card className="p-4 text-center">
                        <Activity className="h-8 w-8 mx-auto text-blue-500 mb-2"/>
                        <p className="font-semibold">Last Sync</p>
                        <p className="text-lg">{lastSync}</p>
                    </Card>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4">
                     <Card className="p-4 text-center">
                        <Heart className="h-8 w-8 mx-auto text-red-500 mb-2"/>
                        <p className="font-semibold">Current Heart Rate</p>
                        <p className="text-2xl">{currentHeartRate} <span className="text-sm">bpm</span></p>
                    </Card>
                    <Card className="p-4 text-center">
                        <Footprints className="h-8 w-8 mx-auto text-green-600 mb-2"/>
                        <p className="font-semibold">Steps Today</p>
                        <p className="text-2xl">{stepsToday.toLocaleString()}</p>
                    </Card>
                    <Card className="p-4 text-center">
                        <Bed className="h-8 w-8 mx-auto text-purple-500 mb-2"/>
                        <p className="font-semibold">Last Night&apos;s Sleep</p>
                        <p className="text-2xl">{lastNightSleep}</p>
                    </Card>
                </div>
              
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleSyncNow}><Activity className="mr-2 h-4 w-4" /> Sync Now</Button>
                <Button variant="destructive" onClick={handleDisconnect}><LinkIcon className="mr-2 h-4 w-4" /> Disconnect</Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <LinkIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-xl font-semibold">Connect Your Wristband</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Follow the instructions in your wristband&apos;s manual to pair it with WakeSync.
              </p>
              <Button className="mt-6" onClick={handleConnect}>
                <Wifi className="mr-2 h-4 w-4" /> Connect Wristband
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {wristbandConnected && (
        <>
        <Card>
            <CardHeader>
                <CardTitle>Data Trends</CardTitle>
                <CardDescription>Visualize your health metrics over time.</CardDescription>
            </CardHeader>
            <CardContent className="grid lg:grid-cols-3 gap-6">
                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                    <BarChart data={mockHrData} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                        <XAxis dataKey="time" fontSize={10} />
                        <YAxis fontSize={10} unit="bpm" />
                        <Tooltip content={<ChartTooltipContent indicator="dot" />} />
                        <Bar dataKey="hr" fill="var(--color-hr)" radius={4} name="Heart Rate" />
                    </BarChart>
                </ChartContainer>
                 <ChartContainer config={chartConfig} className="h-[250px] w-full">
                    <BarChart data={mockActivityData} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                        <XAxis dataKey="day" fontSize={10} />
                        <YAxis fontSize={10} />
                        <Tooltip content={<ChartTooltipContent indicator="dot" />} />
                        <Bar dataKey="steps" fill="var(--color-steps)" radius={4} name="Steps" />
                    </BarChart>
                </ChartContainer>
                 <ChartContainer config={chartConfig} className="h-[250px] w-full">
                    <BarChart data={mockSleepData} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                        <XAxis dataKey="day" fontSize={10} />
                        <YAxis fontSize={10} unit="h"/>
                        <Tooltip content={<ChartTooltipContent indicator="dot" />} />
                        <Bar dataKey="sleep" fill="var(--color-sleep)" radius={4} name="Sleep" />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><SettingsIcon className="h-5 w-5 text-primary"/>Wristband Settings</CardTitle>
                <CardDescription>Customize your wristband notifications and health monitoring preferences.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2"><Bell className="h-4 w-4"/>Notification Preferences</h4>
                    <div className="flex items-center justify-between p-3 border rounded-md">
                        <Label htmlFor="notif-calls" className="flex-1">Call Notifications</Label>
                        <Switch id="notif-calls" checked={notificationsCall} onCheckedChange={setNotificationsCall} />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-md">
                        <Label htmlFor="notif-sms" className="flex-1">SMS Notifications</Label>
                        <Switch id="notif-sms" checked={notificationsSms} onCheckedChange={setNotificationsSms} />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-md">
                        <Label htmlFor="notif-apps" className="flex-1">App Notifications</Label>
                        <Switch id="notif-apps" checked={notificationsApps} onCheckedChange={setNotificationsApps} />
                    </div>
                </div>
                 <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2"><Heart className="h-4 w-4"/>Health Monitoring</h4>
                    <div className="flex items-center justify-between p-3 border rounded-md">
                        <Label htmlFor="monitor-hr" className="flex-1">Continuous Heart Rate</Label>
                        <Switch id="monitor-hr" checked={continuousHr} onCheckedChange={setContinuousHr} />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-md">
                        <Label htmlFor="monitor-sleep" className="flex-1">Automatic Sleep Tracking</Label>
                        <Switch id="monitor-sleep" checked={autoSleepTracking} onCheckedChange={setAutoSleepTracking} />
                    </div>
                     <div className="flex items-center justify-between p-3 border rounded-md">
                        <Label htmlFor="monitor-inactivity" className="flex-1">Inactivity Alert</Label>
                        <Switch id="monitor-inactivity" checked={inactivityAlert} onCheckedChange={setInactivityAlert} />
                    </div>
                </div>
                <Button onClick={handleSaveSettings}><Save className="mr-2 h-4 w-4"/>Save Settings</Button>
            </CardContent>
        </Card>
        </>
      )}
      
      <Card>
        <CardHeader>
            <CardTitle>Compatible Wristbands</CardTitle>
            <CardDescription>WakeSync supports a growing range of smart wristbands and wearables.</CardDescription>
        </CardHeader>
        <CardContent>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>WakeSync Band X1 (Recommended)</li>
                <li>Fitbit Versa Series & Sense Series</li>
                <li>Apple Watch (via HealthKit integration)</li>
                <li>Garmin Vivosmart & Forerunner Series</li>
                <li>Xiaomi Mi Band Series</li>
                <li>Samsung Galaxy Watch Series</li>
            </ul>
            <p className="text-xs mt-4">*Feature availability may vary by device. Some integrations may require companion app setup.</p>
        </CardContent>
      </Card>
    </div>
  );
}
