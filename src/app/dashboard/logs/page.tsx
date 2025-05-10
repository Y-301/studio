"use client";
import React, { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FileText, Activity, AlertTriangle, Info, CheckCircle, Download, RefreshCw, Search, Filter, ArrowDownUp } from "lucide-react";

// Mock log data
const activityLogsData = [
  { timestamp: "2024-07-28 08:30:15", event: "Morning Energizer routine started.", details: "Living Room Lamp ON, Bedroom Thermostat set to 22°C.", source: "Routine Engine" },
  { timestamp: "2024-07-28 08:30:05", event: "Wake-up simulation completed.", details: "Duration: 30 mins, Max Intensity: 70%", source: "Simulation Service" },
  { timestamp: "2024-07-28 08:00:00", event: "Wake-up simulation started.", details: "Soundscape: Nature Sounds", source: "Simulation Service" },
  { timestamp: "2024-07-27 22:45:10", event: "Evening Wind-Down routine started.", details: "All lights OFF, Doors locked.", source: "Routine Engine" },
  { timestamp: "2024-07-27 19:30:00", event: "Device 'Office Speaker' connected.", details: "Type: Speaker, IP: 192.168.1.105", source: "Device Manager" },
  { timestamp: "2024-07-28 09:15:00", event: "User login successful.", details: "User: demo@example.com", source: "Auth Service" },
];

const systemLogsData = [
  { timestamp: "2024-07-28 09:00:00", level: "INFO", message: "System check complete. All services operational.", source: "System Health" },
  { timestamp: "2024-07-28 08:30:00", level: "INFO", message: "AI Routine suggestion generated for user.", source: "AI Service" },
  { timestamp: "2024-07-27 23:00:00", level: "WARN", message: "Device 'Kitchen Blinds' unresponsive. Retrying connection.", source: "Device Manager" },
  { timestamp: "2024-07-27 20:00:00", level: "INFO", message: "Firmware update v1.2.3 applied to WakeSync Hub.", source: "Update Service" },
  { timestamp: "2024-07-28 10:00:00", level: "ERROR", message: "Failed to connect to weather API. Service unavailable.", source: "API Gateway" },
  { timestamp: "2024-07-28 10:05:00", level: "SUCCESS", message: "Database backup completed successfully.", source: "System Core" },
];

const logLevels = ["ALL", "INFO", "WARN", "ERROR", "SUCCESS"] as const;
const logSourcesActivity = ["ALL", "Routine Engine", "Simulation Service", "Device Manager", "Auth Service"] as const;
const logSourcesSystem = ["ALL", "System Health", "AI Service", "Device Manager", "Update Service", "API Gateway", "System Core"] as const;


export default function LogsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState<(typeof logLevels)[number]>("ALL");
  const [filterSource, setFilterSource] = useState<string>("ALL");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [currentTab, setCurrentTab] = useState<"activity" | "system">("activity");

  const getIconForLevel = (level: string) => {
    if (level === "WARN") return <AlertTriangle className="h-5 w-5 text-amber-500" />;
    if (level === "ERROR") return <AlertTriangle className="h-5 w-5 text-red-500" />; // Changed to AlertTriangle for errors too
    if (level === "SUCCESS") return <CheckCircle className="h-5 w-5 text-green-500" />;
    return <Info className="h-5 w-5 text-blue-500" />;
  };

  const filteredAndSortedLogs = useMemo(() => {
    const logsToFilter = currentTab === 'activity' ? activityLogsData : systemLogsData;
    let filtered = logsToFilter.filter(log => {
      const matchesSearch = searchTerm === "" || 
                            log.message?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            log.event?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            log.details?.toLowerCase().includes(searchTerm.toLowerCase());
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">System & Activity Logs</h1>
        <p className="text-muted-foreground">
          Review events, activities, and system status with advanced filtering and sorting.
        </p>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Filter & Sort Logs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 md:space-y-0 md:flex md:flex-wrap md:items-center md:gap-4">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <Search className="h-5 w-5 text-muted-foreground" />
                <Input 
                    placeholder="Search logs..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            {currentTab === 'system' && (
                 <Select value={filterLevel} onValueChange={(value) => setFilterLevel(value as any)}>
                    <SelectTrigger className="w-full md:w-[180px]">
                        <Filter className="mr-2 h-4 w-4" /><SelectValue placeholder="Filter by level" />
                    </SelectTrigger>
                    <SelectContent>
                        {logLevels.map(level => <SelectItem key={level} value={level}>{level}</SelectItem>)}
                    </SelectContent>
                </Select>
            )}
            <Select value={filterSource} onValueChange={setFilterSource}>
                <SelectTrigger className="w-full md:w-[200px]">
                    <Filter className="mr-2 h-4 w-4" /><SelectValue placeholder="Filter by source" />
                </SelectTrigger>
                <SelectContent>
                    {currentLogSources.map(source => <SelectItem key={source} value={source}>{source}</SelectItem>)}
                </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as any)}>
                <SelectTrigger className="w-full md:w-[180px]">
                   <ArrowDownUp className="mr-2 h-4 w-4" /> <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => console.log("Refresh logs")}><RefreshCw className="mr-2 h-4 w-4"/>Refresh</Button>
            <Button variant="outline" disabled><Download className="mr-2 h-4 w-4"/>Export (Soon)</Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="activity" className="w-full" onValueChange={(value) => setCurrentTab(value as "activity" | "system")}>
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="activity"><Activity className="mr-2 h-4 w-4 inline-block"/>Activity Logs</TabsTrigger>
          <TabsTrigger value="system"><FileText className="mr-2 h-4 w-4 inline-block"/>System Logs</TabsTrigger>
        </TabsList>

        <TabsContent value={currentTab}> {/* Use currentTab to ensure content re-renders on tab change */}
          <Card>
            <CardHeader>
              <CardTitle>{currentTab === 'activity' ? 'User & Device Activity' : 'System Performance & Errors'}</CardTitle>
              <CardDescription>
                {currentTab === 'activity' 
                  ? 'Chronological record of actions and events initiated by you or your devices.'
                  : 'Technical logs related to WakeSync system operations and health.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] w-full rounded-md border">
                {filteredAndSortedLogs.length > 0 ? (
                  <Accordion type="multiple" className="p-2">
                    {filteredAndSortedLogs.map((log, index) => (
                      <AccordionItem value={`log-${index}`} key={index} className="border-b last:border-b-0">
                        <AccordionTrigger className="hover:no-underline p-2 rounded-md hover:bg-muted/50 text-left">
                           <div className="flex items-start gap-3 w-full">
                            {log.level ? getIconForLevel(log.level) : <Activity className="h-5 w-5 text-primary"/>}
                            <div className="flex-1">
                                <p className={`text-sm font-medium ${log.level === "ERROR" ? "text-red-600 dark:text-red-400" : (log.level === "WARN" ? "text-amber-600 dark:text-amber-400" : "text-foreground")}`}>
                                  {log.level && `[${log.level}] `}{log.event || log.message}
                                </p>
                                <p className="text-xs text-muted-foreground">{log.timestamp} - {log.source}</p>
                            </div>
                           </div>
                        </AccordionTrigger>
                        <AccordionContent className="p-2 pl-10 bg-secondary/30 rounded-b-md">
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{log.details || "No additional details."}</p>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    <Search className="mx-auto h-10 w-10 mb-2"/>
                    No logs found matching your criteria.
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
