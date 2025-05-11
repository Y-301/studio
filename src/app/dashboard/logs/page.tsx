
"use client";
import React, { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FileText, Activity, AlertTriangle, Info, CheckCircle, Download, RefreshCw, Search, Filter as FilterIcon, ArrowDownUp, Server, Brain } from "lucide-react"; // Added Server, Brain
import { useToast } from "@/hooks/use-toast";

// Mock log data
const activityLogsData = [
  { timestamp: "2024-07-28 08:30:15", event: "Morning Energizer routine started.", details: "Living Room Lamp ON (brightness: 70%), Bedroom Thermostat set to 22°C.", source: "Routine Engine" },
  { timestamp: "2024-07-28 08:30:05", event: "Wake-up simulation completed.", details: "Duration: 30 mins, Max Intensity: 70%, Soundscape: Nature Sounds", source: "Simulation Service" },
  { timestamp: "2024-07-28 08:00:00", event: "Wake-up simulation started.", details: "Soundscape: Nature Sounds, Duration: 30 mins", source: "Simulation Service" },
  { timestamp: "2024-07-27 22:45:10", event: "Evening Wind-Down routine started.", details: "All lights OFF, Doors locked (simulated).", source: "Routine Engine" },
  { timestamp: "2024-07-27 19:30:00", event: "Device 'Office Speaker' connected.", details: "Type: Speaker, IP: 192.168.1.105, User: user1", source: "Device Manager" },
  { timestamp: "2024-07-28 09:15:00", event: "User login successful.", details: "User: demo@example.com, IP: 192.168.1.1", source: "Auth Service" },
  { timestamp: "2024-07-28 10:30:00", event: "Device 'Living Room Lamp' status updated by user.", details: "New status: off", source: "Device Manager" },
];

const systemLogsData = [
  { timestamp: "2024-07-28 09:00:00", level: "INFO", message: "System check complete. All services operational.", source: "System Health" },
  { timestamp: "2024-07-28 08:30:00", level: "INFO", message: "AI Routine suggestion generated for user 'user1'.", source: "AI Service" },
  { timestamp: "2024-07-27 23:00:00", level: "WARN", message: "Device 'Kitchen Blinds' unresponsive. Retrying connection (Attempt 2/3).", source: "Device Manager" },
  { timestamp: "2024-07-27 20:00:00", level: "INFO", message: "Firmware update v1.2.3 applied to WakeSync Hub.", source: "Update Service" },
  { timestamp: "2024-07-28 10:00:00", level: "ERROR", message: "Failed to connect to weather API (api.weather.com). Service unavailable (503).", source: "API Gateway" },
  { timestamp: "2024-07-28 10:05:00", level: "SUCCESS", message: "Database backup completed successfully. Backup ID: backup_20240728100500.zip", source: "System Core" },
  { timestamp: "2024-07-28 11:00:00", level: "DEBUG", message: "Routine 'Morning Energizer' (ID: routine-user1-morning) evaluated for trigger.", source: "SchedulerService" },
];

const logLevels = ["ALL", "DEBUG", "INFO", "WARN", "ERROR", "SUCCESS"] as const;
const logSourcesActivity = ["ALL", "Routine Engine", "Simulation Service", "Device Manager", "Auth Service"] as const;
const logSourcesSystem = ["ALL", "System Health", "AI Service", "Device Manager", "Update Service", "API Gateway", "System Core", "SchedulerService", "RequestLogger", "GlobalErrorHandler"] as const;

type LogLevelType = typeof logLevels[number];

type LogEntry = {
    timestamp: string;
    source: string;
    event?: string; 
    details?: string; 
    level?: LogLevelType; 
    message?: string; 
};


export default function LogsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState<LogLevelType>("ALL");
  const [filterSource, setFilterSource] = useState<string>("ALL");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [currentTab, setCurrentTab] = useState<"activity" | "system">("activity");
  const { toast } = useToast();

  const getIconForLevel = (level?: LogLevelType) => {
    switch(level) {
        case "DEBUG": return <Server className="h-5 w-5 text-gray-500 dark:text-gray-400" />;
        case "INFO": return <Info className="h-5 w-5 text-blue-500 dark:text-blue-400" />;
        case "WARN": return <AlertTriangle className="h-5 w-5 text-amber-500 dark:text-amber-400" />;
        case "ERROR": return <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400" />;
        case "SUCCESS": return <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />;
        default: return <FileText className="h-5 w-5 text-muted-foreground" />;
    }
  };
  
  const getIconForSource = (source?: string) => {
     if (source?.toLowerCase().includes("ai")) return <Brain className="h-5 w-5 text-purple-500" />;
     if (source?.toLowerCase().includes("routine") || source?.toLowerCase().includes("scheduler")) return <Activity className="h-5 w-5 text-primary"/>;
     if (source?.toLowerCase().includes("system")) return <Server className="h-5 w-5 text-slate-500"/>;
     return <Activity className="h-5 w-5 text-primary"/>; // Default for activity logs
  }


  const filteredAndSortedLogs = useMemo(() => {
    const logsToFilter: LogEntry[] = currentTab === 'activity' ? activityLogsData : systemLogsData;
    let filtered = logsToFilter.filter(log => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = searchTerm === "" ||
                            log.message?.toLowerCase().includes(searchLower) ||
                            log.event?.toLowerCase().includes(searchLower) ||
                            log.details?.toLowerCase().includes(searchLower) ||
                            log.source?.toLowerCase().includes(searchLower);
      const matchesLevel = filterLevel === "ALL" || (log.level && log.level === filterLevel);
      const matchesSource = filterSource === "ALL" || log.source === filterSource;

      if (currentTab === 'activity') return matchesSearch && matchesSource;
      return matchesSearch && matchesLevel && matchesSource;
    });

    return filtered.sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });
  }, [searchTerm, filterLevel, filterSource, sortOrder, currentTab]);

  const currentLogSources = currentTab === 'activity' ? logSourcesActivity : logSourcesSystem;


  return (
    <div className="space-y-8 p-4 md:p-6 lg:p-8">
      <div className="flex items-center gap-3">
        <FileText className="h-8 w-8 text-primary"/>
        <div>
            <h1 className="text-3xl font-bold">System & Activity Logs</h1>
            <p className="text-muted-foreground">
            Review events, activities, and system status with advanced filtering and sorting.
            </p>
        </div>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Filter & Sort Logs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 md:space-y-0 md:flex md:flex-wrap md:items-center md:gap-4">
            <div className="relative flex-grow md:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
            </div>
            {currentTab === 'system' && (
                 <Select value={filterLevel} onValueChange={(value) => setFilterLevel(value as LogLevelType)}>
                    <SelectTrigger className="w-full md:w-[180px]">
                        <FilterIcon className="mr-2 h-4 w-4" /><SelectValue placeholder="Filter by level" />
                    </SelectTrigger>
                    <SelectContent>
                        {logLevels.map(level => <SelectItem key={level} value={level}>{level}</SelectItem>)}
                    </SelectContent>
                </Select>
            )}
            <Select value={filterSource} onValueChange={setFilterSource}>
                <SelectTrigger className="w-full md:w-[200px]">
                    <FilterIcon className="mr-2 h-4 w-4" /><SelectValue placeholder="Filter by source" />
                </SelectTrigger>
                <SelectContent>
                    {currentLogSources.map(source => <SelectItem key={source} value={source}>{source}</SelectItem>)}
                </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as "newest" | "oldest")}>
                <SelectTrigger className="w-full md:w-[180px]">
                   <ArrowDownUp className="mr-2 h-4 w-4" /> <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => toast({title: "Logs Refreshed", description:"Log data has been reloaded (Demo)."})}><RefreshCw className="mr-2 h-4 w-4"/>Refresh</Button>
            <Button variant="outline" disabled onClick={() => toast({title: "Export Logs (Demo)", description:"This feature is not yet implemented."})}><Download className="mr-2 h-4 w-4"/>Export</Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="activity" className="w-full" onValueChange={(value) => setCurrentTab(value as "activity" | "system")}>
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="activity"><Activity className="mr-2 h-4 w-4 inline-block"/>Activity Logs</TabsTrigger>
          <TabsTrigger value="system"><Server className="mr-2 h-4 w-4 inline-block"/>System Logs</TabsTrigger>
        </TabsList>

        <TabsContent value={currentTab}>
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>{currentTab === 'activity' ? 'User & Device Activity' : 'System Performance & Errors'}</CardTitle>
              <CardDescription>
                {currentTab === 'activity'
                  ? 'Chronological record of actions and events initiated by you or your devices.'
                  : 'Technical logs related to WakeSync system operations and health.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] w-full rounded-md border p-1">
                {filteredAndSortedLogs.length > 0 ? (
                  <Accordion type="multiple" className="p-2 space-y-1">
                    {filteredAndSortedLogs.map((log, index) => (
                      <AccordionItem value={`log-${index}`} key={index} className="border-b last:border-b-0 bg-card rounded-md shadow-sm hover:bg-muted/30 transition-colors">
                        <AccordionTrigger className="hover:no-underline p-3 rounded-md text-left">
                           <div className="flex items-start gap-3 w-full">
                            {currentTab === 'system' ? getIconForLevel(log.level) : getIconForSource(log.source)}
                            <div className="flex-1 min-w-0"> {/* Ensure text truncation works */}
                                <p className={`text-sm font-medium truncate ${log.level === "ERROR" ? "text-red-600 dark:text-red-400" : (log.level === "WARN" ? "text-amber-600 dark:text-amber-400" : "text-foreground")}`}>
                                  {log.level && `[${log.level}] `}{log.event || log.message}
                                </p>
                                <p className="text-xs text-muted-foreground">{log.timestamp} - {log.source}</p>
                            </div>
                           </div>
                        </AccordionTrigger>
                        <AccordionContent className="p-3 pl-10 bg-secondary/20 dark:bg-secondary/10 rounded-b-md">
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">{log.details || "No additional details."}</p>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    <Search className="mx-auto h-10 w-10 mb-2"/>
                    <p>No logs found matching your criteria.</p>
                    <p className="text-xs mt-1">Try adjusting your search or filter settings.</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

