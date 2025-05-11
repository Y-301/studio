
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, BedDouble, Coffee, Zap, ListChecks, MessageCircle, Lightbulb, Bell, ClockIcon } from "lucide-react"; 
import { Bar, BarChart, Pie, PieChart, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid, Line, LineChart } from 'recharts';
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
    { name: 'Lights', hours: 120, color: "hsl(var(--chart-1))" }, // Use HSL from theme
    { name: 'Thermostat', hours: 150, color: "hsl(var(--chart-2))" },
    { name: 'Speaker', hours: 80, color: "hsl(var(--chart-3))" },
    { name: 'TV', hours: 95, color: "hsl(var(--chart-4))" },
    { name: 'Blinds', hours: 30, color: "hsl(var(--chart-5))" },
];
const routineFrequencyData = [
    { name: 'Morning', executions: 30, color: "hsl(var(--chart-1))"},
    { name: 'Evening', executions: 28, color: "hsl(var(--chart-2))"},
    { name: 'Movie', executions: 12, color: "hsl(var(--chart-3))"},
    { name: 'Workout', executions: 8, color: "hsl(var(--chart-4))"},
];

const energyConsumptionData = [
    { category: 'Lighting', kwh: 25, color: "hsl(var(--chart-1))" },
    { category: 'HVAC', kwh: 60, color: "hsl(var(--chart-2))" },
    { category: 'Entertainment', kwh: 35, color: "hsl(var(--chart-4))" },
    { category: 'Appliances', kwh: 40, color: "hsl(var(--chart-3))" }, 
];

const notificationSummaryData = [
    { type: 'Routine Start', count: 45, color: "hsl(var(--chart-1))" },
    { type: 'Device Alert', count: 12, color: "hsl(var(--chart-2))" },
    { type: 'System Update', count: 5, color: "hsl(var(--chart-3))" },
    { type: 'Low Battery', count: 8, color: "hsl(var(--chart-4))" },
];


const chartConfigSleep = { 
    hours: { label: "Total Sleep", color: "hsl(var(--chart-1))" },
    quality: { label: "Quality" }, // No color needed if not plotted as a series
    deepSleep: { label: "Deep Sleep", color: "hsl(var(--chart-2))" },
    lightSleep: { label: "Light Sleep", color: "hsl(var(--chart-3))" },
    remSleep: { label: "REM Sleep", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig;

const chartConfigEnergy = { 
    level: { label: "Energy Level", color: "hsl(var(--chart-2))" }
} satisfies ChartConfig;

const chartConfigDeviceUsage = {
  hours: { label: "Usage (hours)" },
  Lights: { label: "Lights", color: deviceUsageData.find(d=>d.name==='Lights')?.color },
  Thermostat: { label: "Thermostat", color: deviceUsageData.find(d=>d.name==='Thermostat')?.color },
  Speaker: { label: "Speaker", color: deviceUsageData.find(d=>d.name==='Speaker')?.color },
  TV: { label: "TV", color: deviceUsageData.find(d=>d.name==='TV')?.color },
  Blinds: { label: "Blinds", color: deviceUsageData.find(d=>d.name==='Blinds')?.color },
} satisfies ChartConfig;

const chartConfigRoutineFreq = {
  executions: { label: "Executions" },
  Morning: {label: "Morning", color: routineFrequencyData.find(d=>d.name==='Morning')?.color},
  Evening: {label: "Evening", color: routineFrequencyData.find(d=>d.name==='Evening')?.color},
  Movie: {label: "Movie", color: routineFrequencyData.find(d=>d.name==='Movie')?.color},
  Workout: {label: "Workout", color: routineFrequencyData.find(d=>d.name==='Workout')?.color},
} satisfies ChartConfig;

const chartConfigEnergyConsumption = {
    kwh: { label: "kWh" },
    Lighting: { label: "Lighting", color: energyConsumptionData.find(d=>d.category==='Lighting')?.color },
    HVAC: { label: "HVAC", color: energyConsumptionData.find(d=>d.category==='HVAC')?.color },
    Entertainment: { label: "Entertainment", color: energyConsumptionData.find(d=>d.category==='Entertainment')?.color },
    Appliances: { label: "Appliances", color: energyConsumptionData.find(d=>d.category==='Appliances')?.color },
} satisfies ChartConfig;

const chartConfigNotificationSummary = {
    count: { label: "Count" },
    "Routine Start": { label: "Routine Start", color: notificationSummaryData.find(d=>d.type==='Routine Start')?.color },
    "Device Alert": { label: "Device Alert", color: notificationSummaryData.find(d=>d.type==='Device Alert')?.color },
    "System Update": { label: "System Update", color: notificationSummaryData.find(d=>d.type==='System Update')?.color },
    "Low Battery": { label: "Low Battery", color: notificationSummaryData.find(d=>d.type==='Low Battery')?.color },
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
    <div className="space-y-8 p-4 md:p-6 lg:p-8">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-8 w-8 text-primary"/>
        <div>
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            <p className="text-muted-foreground">
            Track your sleep patterns, energy levels, and smart home usage.
            </p>
        </div>
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
            <p className="text-xs text-muted-foreground">Target: 90% (On-time wake-ups)</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Energy Level</CardTitle>
            <Coffee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7/10</div>
            <p className="text-xs text-muted-foreground">-0.5 from last week (Self-reported)</p>
          </CardContent>
        </Card>
         <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Routine Adherence</CardTitle>
            <ListChecks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92%</div>
            <p className="text-xs text-muted-foreground">"Morning Energizer" completed</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BedDouble className="h-5 w-5 text-primary"/>Weekly Sleep Duration</CardTitle>
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
                {/* Individual sleep stages can be added as stacked bars or separate bars if desired */}
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Coffee className="h-5 w-5 text-primary"/>Daily Energy Levels</CardTitle>
            <CardDescription>Self-reported energy levels throughout a typical day. (Scale: 0-100%)</CardDescription>
          </CardHeader>
          <CardContent>
             <ChartContainer config={chartConfigEnergy} className="h-[300px] w-full">
                <LineChart data={energyData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="time" tickLine={false} axisLine={false}/>
                    <YAxis tickLine={false} axisLine={false} domain={[0, 100]} unit="%"/>
                    <Tooltip 
                        cursor={{ strokeDasharray: '3 3' }}
                        content={<ChartTooltipContent indicator="line" />} 
                    />
                    <Legend />
                    <Line type="monotone" dataKey="level" stroke="var(--color-level)" strokeWidth={2} dot={{r:4}} name="Energy Level"/>
                </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><ClockIcon className="h-5 w-5 text-primary"/>Device Usage (Monthly)</CardTitle>
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
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
         <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><ListChecks className="h-5 w-5 text-primary"/>Routine Execution Frequency</CardTitle>
                <CardDescription>How often your top routines have been executed this month.</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
                <ChartContainer config={chartConfigRoutineFreq} className="h-[300px] w-[300px]">
                    <PieChart >
                        <Tooltip content={<ChartTooltipContent hideLabel />} />
                        <Pie data={routineFrequencyData} dataKey="executions" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                             {routineFrequencyData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
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
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ChartContainer>
                 {/* Comment: Future ML integration - Analyze energy consumption patterns to suggest energy-saving routines. */}
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
                                <Cell key={`cell-${index}`} fill={entry.color} />
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

