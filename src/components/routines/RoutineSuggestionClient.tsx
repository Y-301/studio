"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { suggestRoutine, type SuggestRoutineInput, type SuggestRoutineOutput } from "@/ai/flows/routine-suggestion";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Wand2 } from "lucide-react";

const formSchema = z.object({
  weatherForecast: z.string().min(1, "Weather forecast is required."),
  calendarEvents: z.string().min(1, "Calendar events are required."),
  userPreferences: z.string().min(1, "User preferences are required."),
});

export function RoutineSuggestionClient() {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<SuggestRoutineOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      weatherForecast: "Sunny, 25°C, light breeze.",
      calendarEvents: "09:00 Team Meeting, 14:00 Project Deadline, 18:00 Gym session.",
      userPreferences: "Prefer a calm morning, enjoy coffee, need 30 mins for light exercise.",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setSuggestion(null);
    setError(null);
    try {
      const result = await suggestRoutine(values);
      setSuggestion(result);
    } catch (e) {
      setError("Failed to get routine suggestion. Please try again.");
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="weatherForecast"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Today&apos;s Weather Forecast</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Sunny, 25°C" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="calendarEvents"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Today&apos;s Calendar Events</FormLabel>
                <FormControl>
                  <Textarea placeholder="e.g., 9 AM Meeting, 2 PM Lunch" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="userPreferences"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Preferences for Wake-up Routines</FormLabel>
                <FormControl>
                  <Textarea placeholder="e.g., Prefer quiet mornings, like to read for 15 mins" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-4 w-4" />
            )}
            Suggest Routine
          </Button>
        </form>
      </Form>

      {suggestion && (
        <Card className="mt-6 bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Wand2 className="h-6 w-6" /> AI Suggested Routine
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{suggestion.routineSuggestion}</p>
          </CardContent>
        </Card>
      )}
      {error && (
        <Card className="mt-6 bg-destructive/10 border-destructive/30">
           <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
