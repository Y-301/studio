
"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, ListChecks, Sun, Moon, Zap, Clock, ZapOff, Edit3, Settings, AlertTriangle, Info } from "lucide-react"; // Added icons
import Link from "next/link";
import { RoutineSuggestionClient } from "@/components/routines/RoutineSuggestionClient";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription as ShadcnFormDescription } from "@/components/ui/form"; // Added Form components
import { Separator } from "@/components/ui/separator";


const triggerTypes = ["time", "wristband_event", "manual", "device_state_change"] as const;
const actionDeviceTypes = ["light", "thermostat", "speaker", "blinds", "fan", "switch", "tv", "other"] as const; 

const actionSchema = z.object({
    deviceId: z.string().min(1, "Device selection is required."),
    deviceName: z.string(), 
    deviceType: z.enum(actionDeviceTypes),
    targetState: z.string().min(1, "Target state is required (e.g., on, 22°C, 50% volume)."),
  });

const routineFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, "Routine name must be at least 3 characters."),
  triggerType: z.enum(triggerTypes, { required_error: "Trigger type is required." }),
  triggerDetails: z.string().optional(), 
  actions: z.array(actionSchema).min(1, "At least one action is required."),
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
  { id: "lamp1", name: "Living Room Lamp", type: "light" as const },
  { id: "thermo1", name: "Bedroom Thermostat", type: "thermostat" as const },
  { id: "speaker1", name: "Office Speaker", type: "speaker" as const },
  { id: "blinds1", name: "Kitchen Blinds", type: "blinds" as const },
  { id: "fan1", name: "Ceiling Fan", type: "fan" as const },
  { id: "tv1", name: "Smart TV", type: "tv" as const },
];


export default function RoutinesPage() {
  const [routines, setRoutines] = useState(initialRoutines);
  const [filter, setFilter] = useState<"all" | "morning" | "evening" | "custom">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<RoutineFormData | null>(null);

  const form = useForm<RoutineFormData>({
    resolver: zodResolver(routineFormSchema),
    defaultValues: { name: "", actions: [], active: true, triggerDetails: "" },
  });
  
  const { fields: actionsFields, append: appendAction, remove: removeAction } = useFieldArray({
    control: form.control,
    name: "actions"
  });


  const filteredRoutines = useMemo(() => {
    if (filter === "all") return routines;
    return routines.filter(r => r.name.toLowerCase().includes(filter));
  }, [routines, filter]);

  const handleAddRoutine = () => {
    setEditingRoutine(null);
    form.reset({ name: "", triggerType: undefined, triggerDetails: "", actions: [{deviceId: "", deviceName: "", deviceType: "light", targetState: ""}], active: true });
    setIsModalOpen(true);
  };

  const handleEditRoutine = (routine: (typeof routines)[0]) => {
    const mockFormData: RoutineFormData = {
      id: routine.id,
      name: routine.name,
      triggerType: routine.trigger.toLowerCase().includes("time") ? "time" : (routine.trigger.toLowerCase().includes("wristband") ? "wristband_event" : "manual"),
      triggerDetails: routine.trigger.split(" - ")[1] || "",
      actions: [ 
        { deviceId: "lamp1", deviceName: "Living Room Lamp", deviceType: "light", targetState: "on"},
        { deviceId: "thermo1", deviceName: "Bedroom Thermostat", deviceType: "thermostat", targetState: "22°C"}
      ],
      active: routine.active,
    };
    setEditingRoutine(mockFormData);
    form.reset(mockFormData);
    setIsModalOpen(true);
  };

  const onSubmit = (data: RoutineFormData) => {
    if (editingRoutine && editingRoutine.id) {
      setRoutines(prev => prev.map(r => r.id === editingRoutine.id ? { ...r, ...data, icon: r.icon, description: data.actions.map(a => a.targetState).join(', ') } : r));
    } else {
      const newRoutine = { 
        ...data, 
        id: String(Date.now()), 
        icon: Clock, 
        description: data.actions.map(a => `${a.deviceName} to ${a.targetState}`).join(', '),
        actionsSummary: data.actions.map(a => a.targetState).join(', ').substring(0,30) + "...",
        trigger: `${data.triggerType} - ${data.triggerDetails || 'N/A'}`,
        lastRun: "Never",
        dataAiHint: data.triggerType,
      };
      setRoutines(prev => [...prev, newRoutine as any]);
    }
    setIsModalOpen(false);
    form.reset();
  };

  const toggleRoutineActive = (routineId: string) => {
    setRoutines(prev => prev.map(r => r.id === routineId ? { ...r, active: !r.active } : r));
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
                <Card key={routine.id} className="p-4 hover:shadow-md transition-shadow group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <routine.icon className={`h-8 w-8 ${routine.active ? 'text-primary' : 'text-muted-foreground'} group-hover:scale-110 transition-transform`} />
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
                    <CardDescription className="text-xs">How this routine will start.</CardDescription>
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
                    <CardDescription className="text-xs">What happens when the routine runs.</CardDescription>
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
                                <FormControl><Input {...field} placeholder="e.g. on, 22°C, set_volume_50"/></FormControl>
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
                        <p className="text-destructive text-xs mt-1">{form.formState.errors.actions.message}</p>
                    )}
                     {form.formState.errors.actions?.root && (
                        <p className="text-destructive text-xs mt-1 flex items-center gap-1"><AlertTriangle className="h-3 w-3"/>{form.formState.errors.actions.root.message}</p>
                    )}
                </CardContent>
              </Card>
              
            
              <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-background">
                      <div className="space-y-0.5">
                          <FormLabel>Active</FormLabel>
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
                <Button type="submit" disabled={form.formState.isSubmitting}>{editingRoutine ? "Save Changes" : "Create Routine"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
