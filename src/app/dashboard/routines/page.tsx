"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, ListChecks, Sun, Moon, Zap, Clock, ZapOff, Edit3, Settings } from "lucide-react"; // Added icons
import Link from "next/link";
import { RoutineSuggestionClient } from "@/components/routines/RoutineSuggestionClient";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const triggerTypes = ["time", "wristband_event", "manual", "device_state_change"] as const;
const actionDeviceTypes = ["light", "thermostat", "speaker", "blinds"] as const; // Example, should come from available devices

const routineFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, "Routine name must be at least 3 characters."),
  triggerType: z.enum(triggerTypes, { required_error: "Trigger type is required." }),
  triggerDetails: z.string().optional(), // e.g., "07:00 AM" for time, "sleep_detected" for wristband
  actions: z.array(z.object({
    deviceId: z.string(), // This would be an ID from your devices list
    deviceName: z.string(), // For display
    deviceType: z.enum(actionDeviceTypes),
    targetState: z.string(), // e.g., "on", "off", "22°C", "set_volume_50"
  })).min(1, "At least one action is required."),
  active: z.boolean().default(true),
});

type RoutineFormData = z.infer<typeof routineFormSchema>;

// Mock routines data
const initialRoutines = [
  { id: "1", name: "Morning Energizer", description: "Wake up lights, coffee machine on, morning news.", icon: Sun, active: true, dataAiHint: "morning sun", trigger: "Time - 07:00 AM", actionsSummary: "Lights On, Thermostat 22°C", lastRun: "Today, 07:00 AM" },
  { id: "2", name: "Evening Wind-Down", description: "Dim lights, relaxing music, lock doors.", icon: Moon, active: true, dataAiHint: "night moon", trigger: "Time - 10:00 PM", actionsSummary: "Lights Dim, Speaker Play Relaxing", lastRun: "Yesterday, 10:00 PM" },
  { id: "3", name: "Workout Mode", description: "Cool down room, energizing playlist, track workout.", icon: Zap, active: false, dataAiHint: "fitness gym", trigger: "Manual", actionsSummary: "Fan On, Speaker Play Workout", lastRun: "Never" },
  { id: "4", name: "Good Night (Wristband)", description: "Turns off all lights when sleep is detected.", icon: ZapOff, active: true, dataAiHint: "sleep moon", trigger: "Wristband - Sleep Detected", actionsSummary: "All Lights Off", lastRun: "Today, 12:35 AM"}
];

// Mock devices for action selection in modal
const mockDevicesForActions = [
  { id: "lamp1", name: "Living Room Lamp", type: "light" },
  { id: "thermo1", name: "Bedroom Thermostat", type: "thermostat" },
  { id: "speaker1", name: "Office Speaker", type: "speaker" },
  { id: "blinds1", name: "Kitchen Blinds", type: "blinds" },
];


export default function RoutinesPage() {
  const [routines, setRoutines] = useState(initialRoutines);
  const [filter, setFilter] = useState<"all" | "morning" | "evening" | "custom">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<RoutineFormData | null>(null);

  const { register, handleSubmit, control, reset, watch, setValue, formState: { errors } } = useForm<RoutineFormData>({
    resolver: zodResolver(routineFormSchema),
    defaultValues: { actions: [] },
  });

  const filteredRoutines = useMemo(() => {
    if (filter === "all") return routines;
    return routines.filter(r => r.name.toLowerCase().includes(filter));
  }, [routines, filter]);

  const handleAddRoutine = () => {
    setEditingRoutine(null);
    reset({ name: "", triggerType: undefined, triggerDetails: "", actions: [], active: true });
    setIsModalOpen(true);
  };

  const handleEditRoutine = (routine: (typeof routines)[0]) => {
     // This is a mock conversion. In a real app, routine data would match RoutineFormData
    const mockFormData: RoutineFormData = {
      id: routine.id,
      name: routine.name,
      triggerType: routine.trigger.toLowerCase().includes("time") ? "time" : (routine.trigger.toLowerCase().includes("wristband") ? "wristband_event" : "manual"),
      triggerDetails: routine.trigger.split(" - ")[1] || "",
      actions: [ // MOCK ACTIONS - replace with actual data
        { deviceId: "lamp1", deviceName: "Living Room Lamp", deviceType: "light", targetState: "on"},
        { deviceId: "thermo1", deviceName: "Bedroom Thermostat", deviceType: "thermostat", targetState: "22°C"}
      ],
      active: routine.active,
    };
    setEditingRoutine(mockFormData);
    reset(mockFormData);
    setIsModalOpen(true);
  };

  const onSubmit = (data: RoutineFormData) => {
    if (editingRoutine && editingRoutine.id) {
      // Update existing routine
      setRoutines(prev => prev.map(r => r.id === editingRoutine.id ? { ...r, ...data, icon: r.icon, description: data.actions.map(a => a.targetState).join(', ') } : r));
    } else {
      // Add new routine
      const newRoutine = { 
        ...data, 
        id: String(Date.now()), 
        icon: Clock, // Default icon
        description: data.actions.map(a => `${a.deviceName} to ${a.targetState}`).join(', '),
        actionsSummary: data.actions.map(a => a.targetState).join(', ').substring(0,30) + "...",
        trigger: `${data.triggerType} - ${data.triggerDetails || 'N/A'}`,
        lastRun: "Never",
        dataAiHint: data.triggerType,
      };
      setRoutines(prev => [...prev, newRoutine as any]);
    }
    setIsModalOpen(false);
    reset();
  };

  const toggleRoutineActive = (routineId: string) => {
    setRoutines(prev => prev.map(r => r.id === routineId ? { ...r, active: !r.active } : r));
  };

  // Watch actions array for dynamic rendering
  const currentActions = watch("actions");

  const addAction = () => {
    // Add a default empty action
    setValue("actions", [...currentActions, { deviceId: "", deviceName: "", deviceType: "light", targetState: "" }]);
  };

  const removeAction = (index: number) => {
    setValue("actions", currentActions.filter((_, i) => i !== index));
  };


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
              {filteredRoutines.map((routine) => (
                <Card key={routine.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <routine.icon className={`h-8 w-8 ${routine.active ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div>
                        <h3 className="font-semibold">{routine.name}</h3>
                        <p className="text-sm text-muted-foreground">{routine.description}</p>
                        <div className="text-xs text-muted-foreground mt-1 space-x-2">
                            <span>Trigger: {routine.trigger}</span>
                            <span>Actions: {routine.actionsSummary}</span>
                            <span>Last Run: {routine.lastRun}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <Switch
                        checked={routine.active}
                        onCheckedChange={() => toggleRoutineActive(routine.id)}
                        aria-label={`Toggle ${routine.name}`}
                        id={`routine-toggle-${routine.id}`}
                      />
                      <Label htmlFor={`routine-toggle-${routine.id}`} className="text-sm cursor-pointer">
                        {routine.active ? "Active" : "Inactive"}
                      </Label>
                      <Button variant="ghost" size="icon" onClick={() => handleEditRoutine(routine)}>
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <ListChecks className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-xl font-semibold">No Routines Yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your first routine to automate your tasks.
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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
            <div>
              <Label htmlFor="name">Routine Name</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="triggerType">Trigger Type</Label>
                <Controller
                  name="triggerType"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger id="triggerType"><SelectValue placeholder="Select trigger" /></SelectTrigger>
                      <SelectContent>
                        {triggerTypes.map(type => <SelectItem key={type} value={type} className="capitalize">{type.replace(/_/g, " ")}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.triggerType && <p className="text-destructive text-xs mt-1">{errors.triggerType.message}</p>}
              </div>
              <div>
                <Label htmlFor="triggerDetails">Trigger Details</Label>
                <Input id="triggerDetails" {...register("triggerDetails")} placeholder="e.g., 07:00 AM or sleep_detected" />
              </div>
            </div>

            <div>
              <Label>Actions</Label>
              {currentActions.map((action, index) => (
                <Card key={index} className="p-3 mt-2 space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium">Action {index + 1}</p>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeAction(index)}>Remove</Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Controller
                        name={`actions.${index}.deviceId` as const}
                        control={control}
                        render={({ field }) => (
                        <Select onValueChange={(value) => {
                            const selectedDevice = mockDevicesForActions.find(d => d.id === value);
                            setValue(`actions.${index}.deviceName`, selectedDevice?.name || "");
                            setValue(`actions.${index}.deviceType`, selectedDevice?.type as any); // Cast
                            field.onChange(value);
                        }} defaultValue={field.value}>
                            <SelectTrigger><SelectValue placeholder="Select Device" /></SelectTrigger>
                            <SelectContent>
                            {mockDevicesForActions.map(d => <SelectItem key={d.id} value={d.id}>{d.name} ({d.type})</SelectItem>)}
                            </SelectContent>
                        </Select>
                        )}
                    />
                     <Input {...register(`actions.${index}.targetState` as const)} placeholder="Target state (e.g. on, 22°C)"/>
                  </div>
                   {errors.actions?.[index]?.deviceId && <p className="text-destructive text-xs">{errors.actions[index]?.deviceId?.message}</p>}
                   {errors.actions?.[index]?.targetState && <p className="text-destructive text-xs">{errors.actions[index]?.targetState?.message}</p>}
                </Card>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addAction} className="mt-2">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Action
              </Button>
              {errors.actions && typeof errors.actions === 'object' && 'message' in errors.actions && (
                <p className="text-destructive text-xs mt-1">{errors.actions.message}</p>
              )}
            </div>
            
            <FormField
                control={control}
                name="active"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
                        <FormDescription>
                        Enable or disable this routine.
                        </FormDescription>
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
              <Button type="submit">{editingRoutine ? "Save Changes" : "Create Routine"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
