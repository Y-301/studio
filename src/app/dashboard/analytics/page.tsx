"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, BedDouble, Coffee } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import Image from "next/image";

const sleepData = [
  { date: "Mon", hours: 7.5 },
  { date: "Tue", hours: 6.8 },
  { date: "Wed", hours: 8.1 },
  { date: "Thu", hours: 7.2 },
  { date: "Fri", hours: 6.5 },
  { date: "Sat", hours: 9.0 },
  { date: "Sun", hours: 7.8 },
];

const energyData = [
  { time: "8 AM", level: 60 },
  { time: "10 AM", level: 75 },
  { time: "12 PM", level: 70 },
  { time: "2 PM", level: 55 },
  { time: "4 PM", level: 65 },
  { time: "6 PM", level: 50 },
];

const chartConfigSleep = {
  hours: {
    label: "Sleep Hours",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

const chartConfigEnergy = {
  level: {
    label: "Energy Level",
    color: "hsl(var(--accent))",
  },
} satisfies ChartConfig

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Track your sleep patterns, energy levels, and smart home usage.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Sleep</CardTitle>
            <BedDouble className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7h 35m</div>
            <p className="text-xs text-muted-foreground">+2.5% from last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wake-up Consistency</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-muted-foreground">Target: 90%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Energy Level (Morning)</CardTitle>
            <Coffee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7/10</div>
            <p className="text-xs text-muted-foreground">-0.5 from last week</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Routine Adherence</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92%</div>
            <p className="text-xs text-muted-foreground">"Morning Energizer" routine</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Weekly Sleep Duration</CardTitle>
            <CardDescription>Hours of sleep recorded per day over the last week.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfigSleep} className="h-[300px] w-full">
              <BarChart data={sleepData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} unit="h" />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--muted))' }}
                  content={<ChartTooltipContent />}
                />
                <Legend />
                <Bar dataKey="hours" fill="var(--color-hours)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Daily Energy Levels</CardTitle>
            <CardDescription>Self-reported energy levels throughout a typical day.</CardDescription>
          </CardHeader>
          <CardContent>
             <ChartContainer config={chartConfigEnergy} className="h-[300px] w-full">
                <BarChart data={energyData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="time" tickLine={false} axisLine={false}/>
                    <YAxis tickLine={false} axisLine={false} domain={[0, 100]} unit="%"/>
                    <Tooltip 
                        cursor={{ fill: 'hsl(var(--muted))' }}
                        content={<ChartTooltipContent />} 
                    />
                    <Legend />
                    <Bar dataKey="level" fill="var(--color-level)" radius={4} />
                </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
            <CardTitle>Smart Device Usage</CardTitle>
            <CardDescription>Insights into your most used devices and routines. (Coming Soon)</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
            <Image 
                src="https://picsum.photos/seed/deviceusage/600/300"
                alt="Device Usage Placeholder"
                width={600}
                height={300}
                className="rounded-lg shadow-md object-cover mx-auto"
                data-ai-hint="data charts"
            />
            <p className="mt-4 text-muted-foreground">Detailed device usage analytics are under development.</p>
        </CardContent>
      </Card>
    </div>
  );
}
