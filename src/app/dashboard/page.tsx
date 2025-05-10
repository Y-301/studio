import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, ListChecks, Settings, Smartphone, Sunrise, Zap } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const quickActions = [
    { title: "Manage Devices", href: "/dashboard/devices", icon: Smartphone, description: "View and control your smart devices." },
    { title: "Adjust Routines", href: "/dashboard/routines", icon: ListChecks, description: "Customize your daily automations." },
    { title: "Wake Simulation", href: "/dashboard/simulation", icon: Sunrise, description: "Configure your smart wake-up." },
    { title: "View Analytics", href: "/dashboard/analytics", icon: BarChart, description: "Track your sleep and home data." },
  ];

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl">Welcome to WakeSync!</CardTitle>
          <CardDescription className="text-lg">
            Your personalized hub for a smarter start to your day.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Here you can manage your smart home devices, customize your wake-up routines, simulate your home environment, and much more.
          </p>
          <Button asChild>
            <Link href="/dashboard/routines" className="flex items-center gap-2">
              <Zap className="h-5 w-5" /> Get AI Routine Suggestion
            </Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {quickActions.map(action => (
          <Card key={action.title} className="hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">{action.title}</CardTitle>
              <action.icon className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{action.description}</p>
              <Button variant="outline" size="sm" asChild>
                <Link href={action.href}>Go to {action.title.split(" ")[1]}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
         <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Current Status</CardTitle>
            <CardDescription>Overview of your home and routines.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Morning Routine: <span className="font-semibold text-primary">"Early Bird" Active</span></span>
              <Button variant="ghost" size="sm" asChild><Link href="/dashboard/routines">Manage</Link></Button>
            </div>
            <div className="flex justify-between items-center">
              <span>Connected Devices: <span className="font-semibold text-primary">5</span></span>
              <Button variant="ghost" size="sm" asChild><Link href="/dashboard/devices">View</Link></Button>
            </div>
            <div className="flex justify-between items-center">
              <span>Next Wake-up: <span className="font-semibold text-primary">Tomorrow, 6:30 AM</span></span>
              <Button variant="ghost" size="sm" asChild><Link href="/dashboard/simulation">Adjust</Link></Button>
            </div>
             {/* Image removed */}
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Tips & Suggestions</CardTitle>
            <CardDescription>Optimize your WakeSync experience.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">💡 Try linking your calendar for even smarter routine suggestions!</p>
            <p className="text-sm">☀️ Explore different light intensities in the Wake Up Simulation.</p>
            <p className="text-sm">📊 Check the Analytics page to understand your sleep patterns better.</p>
            <Button variant="secondary" className="mt-4" asChild>
                <Link href="/dashboard/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Explore Settings
                </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
