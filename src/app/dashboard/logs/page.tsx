import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Activity, AlertTriangle } from "lucide-react";

// Mock log data
const activityLogs = [
  { timestamp: "2024-07-28 08:30:15", event: "Morning Energizer routine started.", details: "Living Room Lamp ON, Bedroom Thermostat set to 22°C." },
  { timestamp: "2024-07-28 08:30:05", event: "Wake-up simulation completed.", details: "Duration: 30 mins, Max Intensity: 70%" },
  { timestamp: "2024-07-28 08:00:00", event: "Wake-up simulation started.", details: "Soundscape: Nature Sounds" },
  { timestamp: "2024-07-27 22:45:10", event: "Evening Wind-Down routine started.", details: "All lights OFF, Doors locked." },
  { timestamp: "2024-07-27 19:30:00", event: "Device 'Office Speaker' connected.", details: "Type: Speaker" },
];

const systemLogs = [
  { timestamp: "2024-07-28 09:00:00", level: "INFO", message: "System check complete. All services operational." },
  { timestamp: "2024-07-28 08:30:00", level: "INFO", message: "AI Routine suggestion generated for user." },
  { timestamp: "2024-07-27 23:00:00", level: "WARN", message: "Device 'Kitchen Blinds' unresponsive. Retrying connection.", icon: AlertTriangle },
  { timestamp: "2024-07-27 20:00:00", level: "INFO", message: "Firmware update v1.2.3 applied to WakeSync Hub." },
];

export default function LogsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">System & Activity Logs</h1>
        <p className="text-muted-foreground">
          Review events, activities, and system status.
        </p>
      </div>

      <Tabs defaultValue="activity" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="activity"><Activity className="mr-2 h-4 w-4 inline-block"/>Activity Logs</TabsTrigger>
          <TabsTrigger value="system"><FileText className="mr-2 h-4 w-4 inline-block"/>System Logs</TabsTrigger>
        </TabsList>
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>User & Device Activity</CardTitle>
              <CardDescription>Chronological record of actions and events initiated by you or your devices.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                {activityLogs.map((log, index) => (
                  <div key={index} className="mb-4 pb-4 border-b last:border-b-0 last:mb-0">
                    <p className="text-sm font-medium text-foreground">{log.event}</p>
                    <p className="text-xs text-muted-foreground">{log.timestamp}</p>
                    <p className="text-xs text-muted-foreground mt-1">{log.details}</p>
                  </div>
                ))}
                 {/* Image removed */}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>System Performance & Errors</CardTitle>
              <CardDescription>Technical logs related to WakeSync system operations and health.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                {systemLogs.map((log, index) => (
                  <div key={index} className="mb-4 pb-4 border-b last:border-b-0 last:mb-0 flex items-start gap-3">
                    {log.icon && <log.icon className={`h-5 w-5 mt-0.5 ${log.level === "WARN" ? "text-amber-500" : "text-blue-500" }`} />}
                    {!log.icon && <div className={`h-5 w-5 mt-0.5 rounded-full ${log.level === "INFO" ? "bg-blue-500/20" : "bg-gray-500/20" }`}></div>}
                    <div>
                        <p className={`text-sm font-medium ${log.level === "WARN" ? "text-amber-600 dark:text-amber-400" : "text-foreground"}`}>
                        [{log.level}] {log.message}
                        </p>
                        <p className="text-xs text-muted-foreground">{log.timestamp}</p>
                    </div>
                  </div>
                ))}
                {/* Image removed */}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
