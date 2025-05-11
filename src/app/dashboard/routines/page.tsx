
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, ListChecks, Sun, Moon, Zap, Clock, ZapOff, Edit3, Settings, AlertTriangle, Info, Loader2, Play } from "lucide-react";
import { RoutineSuggestionClient } from "@/components/routines/RoutineSuggestionClient";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea"; // Not used in this version of form
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription as ShadcnFormDescription } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/apiClient";
import type { Device } from "@/components/devices/DeviceCard"; // Assuming Device type is exported here for mockDevices

// Define Routine type matching backend model
interface Routine {
  id: string;
  userId: string;
  name: string;
  description?: string;
  trigger: {
    type: 'time' | 'wristband_event' | 'manual' | 'device_state_change';
    details?: any;
  };
  actions: Array<{
    deviceId: string;
    deviceName: string; // Added for display
    deviceType: Device['type']; // Added for display & logic
    actionType?: string; // e.g., 'turn_on', 'set_brightness' - might be complex
    targetState: string; // Simplified for now: "on", "off", "22°C", "brightness:70"
    actionData?: any;
  }>;
  isEnabled: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastRun?: string;
  icon?: React.ElementType; // For frontend
  dataAiHint?: string; // For frontend
}


const triggerTypes = ["time", "wristband_event", "manual", "device_state_change"] as const;
// Assuming Device type includes 'type'
const actionDeviceTypes = ["light", "thermostat", "speaker", "blinds", "fan", "switch", "tv", "other"] as const;


const actionSchema = z.object({
    deviceId: z.string().min(1, "Device selection is required."),
    deviceName: z.string().min(1, "Device name is required."), // Keep for form state
    deviceType: z.enum(actionDeviceTypes, { errorMap: () => ({ message: "Device type is required."}) }), // Keep for form state
    targetState: z.string().min(1, "Target state is required (e.g., on, 22°C, 50% volume)."),
  });

const routineFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, "Routine name must be at least 3 characters."),
  triggerType: z.enum(triggerTypes, { required_error: "Trigger type is required." }),
  triggerDetails: z.string().optional(),
  actions: z.array(actionSchema).min(1, "At least one action is required."),
  isEnabled: z.boolean().default(true),
});

type RoutineFormData = z.infer<typeof routineFormSchema>;

// Mock devices for action selection in modal
const mockDevicesForActions: Array<Pick<Device, 'id' | 'name' | 'type'>> = [
  { id: "light001", name: "Living Room Lamp", type: "light" },
  { id: "thermostat001", name: "Main Thermostat", type: "thermostat" },
  { id: "speaker001", name: "Kitchen Speaker", type: "speaker" },
  { id: "blinds001", name: "Bedroom Blinds", type: "blinds" },
  { id: "fan001", name: "Office Ceiling Fan", type: "fan" },
  { id: "tv001", name: "Living Room TV", type: "tv" },
];

const routineIconMap: { [key: string]: React.ElementType } = {
  sun: Sun,
  moon: Moon,
  zap: Zap,
  clock: Clock,
  zapoff: ZapOff,
  default: ListChecks,
};


export default function RoutinesPage() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "morning" | "evening" | "custom">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const { toast } = useToast();

  const form = useForm<RoutineFormData>({
    resolver: zodResolver(routineFormSchema),
    defaultValues: { name: "", actions: [], isEnabled: true, triggerDetails: "" },
  });

  const { fields: actionsFields, append: appendAction, remove: removeAction } = useFieldArray({
    control: form.control,
    name: "actions"
  });

  const fetchRoutines = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedRoutines = await apiClient<Routine[]>('/routines');
      setRoutines(fetchedRoutines.map(r => ({
        ...r,
        icon: routineIconMap[r.name.toLowerCase().includes("morning") ? "sun" : r.name.toLowerCase().includes("evening") || r.name.toLowerCase().includes("night") ? "moon" : r.trigger.type === 'manual' ? "zap" : "default"] || ListChecks,
      })));
    } catch (err) {
      setError((err as Error).message || "Failed to fetch routines.");
      toast({ title: "Error", description: (err as Error).message || "Could not fetch routines.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutines();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const filteredRoutines = useMemo(() => {
    if (filter === "all") return routines;
    return routines.filter(r => r.name.toLowerCase().includes(filter));
  }, [routines, filter]);

  const handleAddRoutine = () => {
    setEditingRoutine(null);
    form.reset({ name: "", triggerType: "time", triggerDetails: "", actions: [{deviceId: "", deviceName: "", deviceType: "light", targetState: ""}], isEnabled: true });
    setIsModalOpen(true);
  };

  const handleEditRoutine = (routine: Routine) => {
    setEditingRoutine(routine);
    form.reset({
      id: routine.id,
      name: routine.name,
      triggerType: routine.trigger.type,
      triggerDetails: routine.trigger.details || "",
      actions: routine.actions.map(a => ({ // Ensure actions are mapped correctly
          deviceId: a.deviceId,
          deviceName: a.deviceName || mockDevicesForActions.find(d => d.id === a.deviceId)?.name || 'Unknown Device',
          deviceType: a.deviceType || mockDevicesForActions.find(d => d.id === a.deviceId)?.type || 'other',
          targetState: a.targetState,
      })),
      isEnabled: routine.isEnabled,
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: RoutineFormData) => {
    const payload = {
        name: data.name,
        trigger: {
            type: data.triggerType,
            details: data.triggerDetails,
        },
        actions: data.actions.map(a => ({ // Ensure backend format
            deviceId: a.deviceId,
            // actionType: could be derived or fixed for now
            targetState: a.targetState, // Send simplified targetState
            // actionData: might need complex parsing from targetState
        })),
        isEnabled: data.isEnabled,
        description: data.actions.map(a => `${mockDevicesForActions.find(d => d.id === a.deviceId)?.name || a.deviceId} to ${a.targetState}`).join(', '), // For backend model
    };

    try {
      if (editingRoutine && editingRoutine.id) {
        await apiClient<Routine>(`/routines/${editingRoutine.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        toast({ title: "Routine Updated", description: `${data.name} has been updated successfully.`});
      } else {
        await apiClient<Routine>('/routines', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast({ title: "Routine Created", description: `${data.name} has been created.`});
      }
      fetchRoutines();
      setIsModalOpen(false);
      form.reset();
    } catch (err) {
      toast({ title: "Operation Failed", description: (err as Error).message, variant: "destructive" });
    }
  };

 const toggleRoutineActive = async (routine: Routine) => {
    const newIsEnabled = !routine.isEnabled;
    try {
        await apiClient<Routine>(`/routines/${routine.id}`, {
            method: 'PUT',
            body: JSON.stringify({ isEnabled: newIsEnabled }),
        });
        toast({
            title: `Routine ${newIsEnabled ? 'Activated' : 'Deactivated'}`,
            description: `${routine.name} is now ${newIsEnabled ? 'active' : 'inactive'}.`
        });
        fetchRoutines(); // Refresh list
    } catch (err) {
        toast({ title: "Toggle Failed", description: (err as Error).message, variant: "destructive" });
    }
  };

  const handleTriggerRoutine = async (routineId: string, routineName: string) => {
    try {
        await apiClient(`/routines/${routineId}/trigger`, { method: 'POST' });
        toast({ title: "Routine Triggered", description: `${routineName} has been triggered successfully.` });
        fetchRoutines(); // Refresh to update lastRun or other status
    } catch (err) {
        toast({ title: "Trigger Failed", description: (err as Error).message, variant: "destructive" });
    }
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Loading Routines...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-destructive">
        <AlertTriangle className="h-12 w-12 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Error Fetching Routines</h2>
        <p className="text-center mb-4">{error}</p>
        <Button onClick={fetchRoutines}><PlusCircle className="mr-2 h-4 w-4"/>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Your Routines</h1>
          <p className="text-muted-foreground">
            Automate your day with personalized routines.
          </p>
        </div>
        <Button onClick={handleAddRoutine}>
          <PlusCircle className="mr-2 h-4 w-4" /> Create New Routine
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>AI Routine Suggester</CardTitle>
          <CardDescription>Let WakeSync AI help you craft the perfect routine based on your day.</CardDescription>
        </CardHeader>
        <CardContent>
          <RoutineSuggestionClient />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Saved Routines</CardTitle>
          <CardDescription>Manage your existing routines or create new ones.</CardDescription>
           <div className="flex space-x-2 pt-2">
            {(["all", "morning", "evening", "custom"] as const).map(f => (
              <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {filteredRoutines.length > 0 ? (
            <div className="space-y-4">
              {filteredRoutines.map((routine) => {
                 const RoutineIcon = routine.icon || ListChecks;
                 const actionsSummary = routine.actions.map(a => `${a.deviceName || a.deviceId} to ${a.targetState}`).slice(0, 2).join(', ') + (routine.actions.length > 2 ? '...' : '');
                 return (
                    <Card key={routine.id} className="p-4 hover:shadow-md transition-shadow group">
                    <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-4">
                        <div className="flex items-center gap-4 flex-1">
                        <RoutineIcon className={`h-8 w-8 ${routine.isEnabled ? 'text-primary' : 'text-muted-foreground'} group-hover:scale-110 transition-transform shrink-0`} />
                        <div className="flex-1">
                            <h3 className="font-semibold">{routine.name}</h3>
                            <p className="text-sm text-muted-foreground truncate max-w-xs sm:max-w-md md:max-w-lg" title={routine.description}>{routine.description || "No description."}</p>
                            <div className="text-xs text-muted-foreground mt-1 space-x-2 flex flex-wrap">
                                <span>Trigger: {routine.trigger.type} - {routine.trigger.details || 'N/A'}</span>
                                <span className="truncate" title={actionsSummary}>Actions: {actionsSummary || "No actions defined"}</span>
                                <span>Last Run: {routine.lastRun || "Never"}</span>
                            </div>
                        </div>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-center">
                        <Button variant="outline" size="sm" onClick={() => handleTriggerRoutine(routine.id, routine.name)} disabled={!routine.isEnabled}>
                            <Play className="mr-1 h-4 w-4"/> Run
                        </Button>
                        <Switch
                            checked={routine.isEnabled}
                            onCheckedChange={() => toggleRoutineActive(routine)}
                            aria-label={`Toggle ${routine.name}`}
                            id={`routine-toggle-${routine.id}`}
                        />
                        <Label htmlFor={`routine-toggle-${routine.id}`} className="text-sm cursor-pointer">
                            {routine.isEnabled ? "Active" : "Inactive"}
                        </Label>
                        <Button variant="ghost" size="icon" onClick={() => handleEditRoutine(routine)}>
                            <Edit3 className="h-4 w-4" />
                        </Button>
                        </div>
                    </div>
                    </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <ListChecks className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-xl font-semibold">No Routines Found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Try a different filter or create your first routine.
              </p>
              <Button className="mt-4" onClick={handleAddRoutine}>
                <PlusCircle className="mr-2 h-4 w-4" /> Create Routine
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingRoutine ? "Edit Routine" : "Create New Routine"}</DialogTitle>
            <DialogDescription>
              {editingRoutine ? "Update the details of your automated routine." : "Define the trigger and actions for your new routine."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Routine Name</FormLabel>
                    <FormControl><Input placeholder="e.g., Morning Wake Up" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Card className="p-4 bg-secondary/30">
                <CardHeader className="p-0 pb-3">
                    <CardTitle className="text-lg">Trigger</CardTitle>
                    <ShadcnFormDescription className="text-xs">How this routine will start.</ShadcnFormDescription>
                </CardHeader>
                <CardContent className="p-0 space-y-4">
                    <FormField
                        control={form.control}
                        name="triggerType"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Trigger Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select trigger" /></SelectTrigger></FormControl>
                            <SelectContent>
                                {triggerTypes.map(type => <SelectItem key={type} value={type} className="capitalize">{type.replace(/_/g, " ")}</SelectItem>)}
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="triggerDetails"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Trigger Details</FormLabel>
                            <FormControl><Input placeholder="e.g., 07:00 AM or sleep_detected" {...field} /></FormControl>
                            <ShadcnFormDescription className="text-xs">
                                For 'Time', use HH:MM AM/PM. For 'Wristband Event', use events like 'sleep_detected', 'awake'.
                            </ShadcnFormDescription>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </CardContent>
              </Card>

              <Separator />

              <Card className="p-4 bg-secondary/30">
                <CardHeader className="p-0 pb-3">
                     <CardTitle className="text-lg">Actions</CardTitle>
                    <ShadcnFormDescription className="text-xs">What happens when the routine runs.</ShadcnFormDescription>
                </CardHeader>
                <CardContent className="p-0 space-y-3">
                    {actionsFields.map((field, index) => (
                        <Card key={field.id} className="p-3 mt-2 space-y-3 bg-background shadow-sm">
                        <div className="flex justify-between items-center">
                            <p className="text-sm font-medium">Action {index + 1}</p>
                            {actionsFields.length > 1 && (
                                <Button type="button" variant="ghost" size="sm" onClick={() => removeAction(index)} className="text-destructive hover:text-destructive/80">Remove</Button>
                            )}
                        </div>
                        <FormField
                            control={form.control}
                            name={`actions.${index}.deviceId`}
                            render={({ field: controllerField }) => (
                            <FormItem>
                                <FormLabel>Device</FormLabel>
                                <Select
                                    onValueChange={(value) => {
                                        const selectedDevice = mockDevicesForActions.find(d => d.id === value);
                                        form.setValue(`actions.${index}.deviceName`, selectedDevice?.name || "");
                                        form.setValue(`actions.${index}.deviceType`, selectedDevice?.type as any);
                                        controllerField.onChange(value);
                                    }}
                                    defaultValue={controllerField.value}
                                >
                                <FormControl><SelectTrigger><SelectValue placeholder="Select Device" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {mockDevicesForActions.map(d => <SelectItem key={d.id} value={d.id}>{d.name} ({d.type})</SelectItem>)}
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name={`actions.${index}.targetState`}
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Target State</FormLabel>
                                <FormControl><Input {...field} placeholder="e.g. on, 22°C, brightness:70"/></FormControl>
                                <ShadcnFormDescription className="text-xs">Define the desired state or command for the device.</ShadcnFormDescription>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        </Card>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => appendAction({ deviceId: "", deviceName: "", deviceType: "light", targetState: "" })} className="mt-2 w-full">
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Action
                    </Button>
                    {form.formState.errors.actions && typeof form.formState.errors.actions === 'object' && 'message' in form.formState.errors.actions && (
                        <p className="text-destructive text-xs mt-1">{String(form.formState.errors.actions.message)}</p>
                    )}
                     {form.formState.errors.actions?.root && (
                        <p className="text-destructive text-xs mt-1 flex items-center gap-1"><AlertTriangle className="h-3 w-3"/>{form.formState.errors.actions.root.message}</p>
                    )}
                </CardContent>
              </Card>


              <FormField
                  control={form.control}
                  name="isEnabled"
                  render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-background">
                      <div className="space-y-0.5">
                          <FormLabel>Enabled</FormLabel>
                          <ShadcnFormDescription className="text-xs">
                            Enable or disable this routine.
                          </ShadcnFormDescription>
                      </div>
                      <FormControl>
                          <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          />
                      </FormControl>
                      </FormItem>
                  )}
              />


              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingRoutine ? "Save Changes" : "Create Routine"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
