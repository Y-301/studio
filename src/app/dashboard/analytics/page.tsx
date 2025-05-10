
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, BedDouble, Coffee, Zap, ListChecks, MessageCircle, Lightbulb, Bell } from "lucide-react"; // Added Bell
import { Bar, BarChart, Pie, PieChart, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import React from "react";

const sleepData = [
  { date: "Mon", hours: 7.5, quality: "Good", deepSleep: 2.1, lightSleep: 4.0, remSleep: 1.4 }, 
  { date: "Tue", hours: 6.8, quality: "Fair", deepSleep: 1.8, lightSleep: 3.5, remSleep: 1.5 }, 
  { date: "Wed", hours: 8.1, quality: "Excellent", deepSleep: 2.5, lightSleep: 4.2, remSleep: 1.4 },
  { date: "Thu", hours: 7.2, quality: "Good", deepSleep: 2.0, lightSleep: 3.8, remSleep: 1.4 }, 
  { date: "Fri", hours: 6.5, quality: "Poor", deepSleep: 1.5, lightSleep: 3.2, remSleep: 1.8 }, 
  { date: "Sat", hours: 9.0, quality: "Excellent", deepSleep: 3.0, lightSleep: 4.5, remSleep: 1.5 },
  { date: "Sun", hours: 7.8, quality: "Good", deepSleep: 2.2, lightSleep: 4.1, remSleep: 1.5 },
];

const energyData = [
  { time: "8 AM", level: 60 }, { time: "10 AM", level: 75 }, { time: "12 PM", level: 70 },
  { time: "2 PM", level: 55 }, { time: "4 PM", level: 65 }, { time: "6 PM", level: 50 },
];

const deviceUsageData = [
    { name: 'Lights', hours: 120, fill: "var(--color-lights)" },
    { name: 'Thermostat', hours: 150, fill: "var(--color-thermostat)" },
    { name: 'Speaker', hours: 80, fill: "var(--color-speaker)" },
    { name: 'TV', hours: 95, fill: "var(--color-tv)" },
    { name: 'Blinds', hours: 30, fill: "var(--color-blinds)" },
];
const routineFrequencyData = [
    { name: 'Morning', executions: 30, fill: "var(--color-morning)"},
    { name: 'Evening', executions: 28, fill: "var(--color-evening)"},
    { name: 'Movie', executions: 12, fill: "var(--color-movie)"},
    { name: 'Workout', executions: 8, fill: "var(--color-workout)"},
];

const energyConsumptionData = [
    { category: 'Lighting', kwh: 25, fill: "var(--color-lights)" },
    { category: 'HVAC', kwh: 60, fill: "var(--color-thermostat)" },
    { category: 'Entertainment', kwh: 35, fill: "var(--color-tv)" },
    { category: 'Appliances', kwh: 40, fill: "var(--color-speaker)" }, // Re-using speaker color for demo
];

const notificationSummaryData = [
    { type: 'Routine Start', count: 45, fill: "var(--color-morning)" },
    { type: 'Device Alert', count: 12, fill: "var(--color-evening)" },
    { type: 'System Update', count: 5, fill: "var(--color-movie)" },
    { type: 'Low Battery', count: 8, fill: "var(--color-workout)" },
];


const chartConfigSleep = { 
    hours: { label: "Total Sleep", color: "hsl(var(--chart-1))" },
    quality: { label: "Quality" },
    deepSleep: { label: "Deep Sleep", color: "hsl(var(--chart-2))" },
    lightSleep: { label: "Light Sleep", color: "hsl(var(--chart-3))" },
    remSleep: { label: "REM Sleep", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig;
const chartConfigEnergy = { level: { label: "Energy Level", color: "hsl(var(--chart-2))" }} satisfies ChartConfig;
const chartConfigDeviceUsage = {
  hours: { label: "Usage (hours)" },
  lights: { label: "Lights", color: "hsl(var(--chart-1))" },
  thermostat: { label: "Thermostat", color: "hsl(var(--chart-2))" },
  speaker: { label: "Speaker", color: "hsl(var(--chart-3))" },
  tv: { label: "TV", color: "hsl(var(--chart-4))" },
  blinds: { label: "Blinds", color: "hsl(var(--chart-5))" },
} satisfies ChartConfig;
const chartConfigRoutineFreq = {
  executions: { label: "Executions" },
  morning: {label: "Morning", color: "hsl(var(--chart-1))"},
  evening: {label: "Evening", color: "hsl(var(--chart-2))"},
  movie: {label: "Movie", color: "hsl(var(--chart-3))"},
  workout: {label: "Workout", color: "hsl(var(--chart-4))"},
} satisfies ChartConfig;

const chartConfigEnergyConsumption = {
    kwh: { label: "kWh" },
    lights: { label: "Lighting", color: "hsl(var(--chart-1))" },
    thermostat: { label: "HVAC", color: "hsl(var(--chart-2))" },
    tv: { label: "Entertainment", color: "hsl(var(--chart-4))" },
    speaker: { label: "Appliances", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig;

const chartConfigNotificationSummary = {
    count: { label: "Count" },
    morning: { label: "Routine Start", color: "hsl(var(--chart-1))" },
    evening: { label: "Device Alert", color: "hsl(var(--chart-2))" },
    movie: { label: "System Update", color: "hsl(var(--chart-3))" },
    workout: { label: "Low Battery", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig;

const CustomSleepTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col">
            <span className="text-[0.70rem] uppercase text-muted-foreground">
              Day
            </span>
            <span className="font-bold text-muted-foreground">{label}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[0.70rem] uppercase text-muted-foreground">
              Total Sleep
            </span>
            <span className="font-bold" style={{ color: chartConfigSleep.hours.color }}>
              {data.hours}h
            </span>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-1 gap-1 text-xs">
            <div>Quality: <span className="font-medium">{data.quality}</span></div>
            <div>Deep: <span className="font-medium" style={{ color: chartConfigSleep.deepSleep.color }}>{data.deepSleep}h</span></div>
            <div>Light: <span className="font-medium" style={{ color: chartConfigSleep.lightSleep.color }}>{data.lightSleep}h</span></div>
            <div>REM: <span className="font-medium" style={{ color: chartConfigSleep.remSleep.color }}>{data.remSleep}h</span></div>
        </div>
      </div>
    );
  }
  return null;
};


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
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Sleep</CardTitle>
            <BedDouble className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7h 35m</div>
            <p className="text-xs text-muted-foreground">+2.5% from last week</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wake-up Consistency</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-muted-foreground">Target: 90%</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Energy Level</CardTitle>
            <Coffee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7/10</div>
            <p className="text-xs text-muted-foreground">-0.5 from last week</p>
          </CardContent>
        </Card>
         <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Routine Adherence</CardTitle>
            <ListChecks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92%</div>
            <p className="text-xs text-muted-foreground">"Morning Energizer"</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Weekly Sleep Duration</CardTitle>
            <CardDescription>Hours of sleep recorded per day over the last week. Includes quality and sleep stage breakdown in tooltip.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfigSleep} className="h-[300px] w-full">
              <BarChart data={sleepData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} unit="h" />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--muted))' }}
                  content={<CustomSleepTooltip />}
                />
                <Legend />
                <Bar dataKey="hours" fill="var(--color-hours)" radius={4} name="Total Sleep" />
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
                    <Bar dataKey="level" fill="var(--color-level)" radius={4} name="Energy Level"/>
                </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Device Usage Over Time (Monthly)</CardTitle>
                <CardDescription>Total hours of usage by device category this month.</CardDescription>
            </CardHeader>
            <CardContent>
                 <ChartContainer config={chartConfigDeviceUsage} className="h-[300px] w-full">
                    <BarChart data={deviceUsageData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false}/>
                        <XAxis type="number" unit="h" tickLine={false} axisLine={false} />
                        <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={80}/>
                        <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent />} />
                        <Legend />
                        <Bar dataKey="hours" radius={4}>
                            {deviceUsageData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Bar>
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
         <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Routine Execution Frequency</CardTitle>
                <CardDescription>How often your top routines have been executed this month.</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
                <ChartContainer config={chartConfigRoutineFreq} className="h-[300px] w-[300px]">
                    <PieChart >
                        <Tooltip content={<ChartTooltipContent hideLabel />} />
                        <Pie data={routineFrequencyData} dataKey="executions" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                             {routineFrequencyData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Pie>
                        <Legend/>
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-primary" />Estimated Energy Consumption</CardTitle>
                <CardDescription>Monthly overview of energy usage by smart device categories (kWh).</CardDescription>
            </CardHeader>
            <CardContent>
                 <ChartContainer config={chartConfigEnergyConsumption} className="h-[300px] w-full">
                    <BarChart data={energyConsumptionData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="category" tickLine={false} axisLine={false} />
                        <YAxis tickLine={false} axisLine={false} unit="kWh" />
                        <Tooltip 
                          cursor={{ fill: 'hsl(var(--muted))' }}
                          content={<ChartTooltipContent />}
                        />
                        <Legend />
                         <Bar dataKey="kwh" radius={4}>
                            {energyConsumptionData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Bar>
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle  className="flex items-center gap-2"><Bell className="h-5 w-5 text-primary" />Notification Summary</CardTitle>
                <CardDescription>Breakdown of notifications received this month by type.</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
                 <ChartContainer config={chartConfigNotificationSummary} className="h-[300px] w-[300px]">
                    <PieChart >
                        <Tooltip content={<ChartTooltipContent hideLabel />} />
                        <Pie data={notificationSummaryData} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={100} label>
                             {notificationSummaryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Pie>
                        <Legend/>
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
