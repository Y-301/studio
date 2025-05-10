
"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, ListChecks, Settings, Smartphone, Sunrise, Zap, UserCircle } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import type { User } from "firebase/auth";

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [greetingName, setGreetingName] = useState<string>("Guest");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (user) {
        setGreetingName(user.displayName || user.email || "User");
      } else {
        setGreetingName("Guest");
      }
    });
    return () => unsubscribe();
  }, []);

  const quickActions = [
    { title: "Manage Devices", href: "/dashboard/devices", icon: Smartphone, description: "View and control your smart devices.", requiresAuth: true },
    { title: "Adjust Routines", href: "/dashboard/routines", icon: ListChecks, description: "Customize your daily automations.", requiresAuth: true },
    { title: "Wake Simulation", href: "/dashboard/simulation", icon: Sunrise, description: "Configure your smart wake-up." },
    { title: "View Analytics", href: "/dashboard/analytics", icon: BarChart, description: "Track your sleep and home data." },
  ];

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            {currentUser?.photoURL ? (
              <img src={currentUser.photoURL} alt="User Avatar" className="h-12 w-12 rounded-full" data-ai-hint="user avatar" />
            ) : (
              <UserCircle className="h-12 w-12 text-muted-foreground" />
            )}
            <CardTitle className="text-3xl">Welcome, {greetingName}!</CardTitle>
          </div>
          <CardDescription className="text-lg">
            Your personalized hub for a smarter start to your day.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Here you can manage your smart home devices, customize your wake-up routines, simulate your home environment, and much more.
          </p>
          {currentUser && (
            <Button asChild>
              <Link href="/dashboard/routines" className="flex items-center gap-2">
                <Zap className="h-5 w-5" /> Get AI Routine Suggestion
              </Link>
            </Button>
          )}
          {!currentUser && (
             <Button asChild variant="outline">
              <Link href="/auth/login" className="flex items-center gap-2">
                Login to unlock all features
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {quickActions.map(action => (
          <Card key={action.title} className="hover:shadow-xl transition-shadow duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">{action.title}</CardTitle>
              <action.icon className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{action.description}</p>
              <Button 
                variant="outline" 
                size="sm" 
                asChild={!action.requiresAuth || !!currentUser} 
                disabled={action.requiresAuth && !currentUser}
                onClick={action.requiresAuth && !currentUser ? (e) => e.preventDefault() : undefined}
              >
                <Link href={action.requiresAuth && !currentUser ? "#" : action.href}>Go to {action.title.split(" ")[0]}</Link>
              </Button>
              {action.requiresAuth && !currentUser && <p className="text-xs text-destructive mt-1">Login required</p>}
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
              <span>Morning Routine: 
                <span className="font-semibold text-primary">
                  {currentUser ? " \"Early Bird\" Active" : " N/A (Login required)"}
                </span>
              </span>
              <Button variant="ghost" size="sm" asChild disabled={!currentUser}>
                <Link href={currentUser ? "/dashboard/routines" : "#"}>Manage</Link>
              </Button>
            </div>
            <div className="flex justify-between items-center">
              <span>Connected Devices: 
                <span className="font-semibold text-primary">
                  {currentUser ? " 5" : " N/A (Login required)"}
                </span>
              </span>
              <Button variant="ghost" size="sm" asChild disabled={!currentUser}>
                <Link href={currentUser ? "/dashboard/devices" : "#"}>View</Link>
              </Button>
            </div>
            <div className="flex justify-between items-center">
              <span>Next Wake-up: <span className="font-semibold text-primary">Tomorrow, 6:30 AM</span></span>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/simulation">Adjust</Link>
              </Button>
            </div>
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
            <Button variant="secondary" className="mt-4" asChild disabled={!currentUser}>
                <Link href={currentUser ? "/dashboard/settings" : "#"}>
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
