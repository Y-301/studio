"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, BedDouble, Coffee, Zap, ListChecks, MessageCircle, Lightbulb } from "lucide-react";
import { Bar, BarChart, Pie, PieChart, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const sleepData = [
  { date: "Mon", hours: 7.5 }, { date: "Tue", hours: 6.8 }, { date: "Wed", hours: 8.1 },
  { date: "Thu", hours: 7.2 }, { date: "Fri", hours: 6.5 }, { date: "Sat", hours: 9.0 },
  { date: "Sun", hours: 7.8 },
];

const energyData = [
  { time: "8 AM", level: 60 }, { time: "10 AM", level: 75 }, { time: "12 PM", level: 70 },
  { time: "2 PM", level: 55 }, { time: "4 PM", level: 65 }, { time: "6 PM", level: 50 },
];

const deviceUsageData = [
    { name: 'Smart Lights', hours: 120, fill: "var(--color-lights)" },
    { name: 'Thermostat', hours: 150, fill: "var(--color-thermostat)" },
    { name: 'Smart Speaker', hours: 80, fill: "var(--color-speaker)" },
    { name: 'TV', hours: 95, fill: "var(--color-tv)" },
    { name: 'Blinds', hours: 30, fill: "var(--color-blinds)" },
];
const routineFrequencyData = [
    { name: 'Morning Energizer', executions: 30, fill: "var(--color-morning)"},
    { name: 'Evening Wind-Down', executions: 28, fill: "var(--color-evening)"},
    { name: 'Movie Night', executions: 12, fill: "var(--color-movie)"},
    { name: 'Workout Mode', executions: 8, fill: "var(--color-workout)"},
];

const chartConfigSleep = { hours: { label: "Sleep Hours", color: "hsl(var(--chart-1))" }} satisfies ChartConfig;
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
            <CardTitle className="text-sm font-medium">Avg. Energy Level</CardTitle>
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
                <Bar dataKey="hours" fill="var(--color-hours)" radius={4} name="Sleep Hours" />
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
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-primary" />Estimated Energy Consumption</CardTitle>
                <CardDescription>Overview of energy usage by smart devices. (Coming Soon)</CardDescription>
            </CardHeader>
            <CardContent className="text-center py-12">
                <Lightbulb className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">Detailed energy consumption analytics are under development.</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle  className="flex items-center gap-2"><MessageCircle className="h-5 w-5 text-primary" />Notification Summary</CardTitle>
                <CardDescription>Breakdown of notifications received and interacted with. (Coming Soon)</CardDescription>
            </CardHeader>
            <CardContent className="text-center py-12">
                <Bell className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">Notification analytics are under development.</p>
            </CardContent>
        </Card>
      </div>


    </div>
  );
}
