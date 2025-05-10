
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { UserCircle, Bell, ShieldCheck, CreditCard, SlidersHorizontal, Link as LinkIcon, AlertTriangle, Trash2, Camera, LogOut } from "lucide-react"; // Added Camera
import { useToast } from "@/hooks/use-toast";
import React, { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { useRouter } // Added for logout redirect

from 'next/navigation';


const profileFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  timezone: z.string().min(1, "Timezone is required."),
});

const preferencesFormSchema = z.object({
  darkMode: z.boolean().default(false),
  notifications: z.object({
    email: z.boolean().default(true),
    push: z.boolean().default(true),
  }),
  defaultWakeUpSound: z.string().optional(),
});

const passwordFormSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z.string().min(8, "New password must be at least 8 characters."),
    confirmNewPassword: z.string(),
}).refine(data => data.newPassword === data.confirmNewPassword, {
    message: "New passwords don't match",
    path: ["confirmNewPassword"],
});


export default function SettingsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | null>(null);


  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      profileForm.setValue("name", user.displayName || "");
      profileForm.setValue("email", user.email || "");
      setCurrentUserName(user.displayName);
      setCurrentUserEmail(user.email);
      setCurrentUserAvatar(user.photoURL);
      // Ideally, fetch timezone from user profile in DB if stored
    }
  }, []);


  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "", // Will be set from Firebase auth
      email: "", // Will be set from Firebase auth
      timezone: "America/New_York",
    },
  });

  const preferencesForm = useForm<z.infer<typeof preferencesFormSchema>>({
    resolver: zodResolver(preferencesFormSchema),
    defaultValues: {
      darkMode: false, 
      notifications: {
        email: true,
        push: true,
      },
      defaultWakeUpSound: "nature_sounds",
    },
  });
  
  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
    },
  });


  function onProfileSubmit(values: z.infer<typeof profileFormSchema>) {
    // TODO: Implement actual profile update (e.g., to Firebase profile or your DB)
    console.log("Profile updated:", values);
    toast({ title: "Profile Updated (Demo)", description: "Your profile information has been 'saved'." });
  }

  function onPreferencesSubmit(values: z.infer<typeof preferencesFormSchema>) {
    console.log("Preferences updated:", values);
    toast({ title: "Preferences Updated", description: "Your app preferences have been saved." });
    if (typeof window !== 'undefined') {
      const newIsDarkMode = values.darkMode;
      if (newIsDarkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    }
  }
  
  async function onPasswordSubmit(values: z.infer<typeof passwordFormSchema>) {
    const user = auth.currentUser;
    if (!user || !user.email) {
        toast({ title: "Error", description: "User not found or email not available.", variant: "destructive" });
        return;
    }
    try {
        const credential = EmailAuthProvider.credential(user.email, values.currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, values.newPassword);
        toast({ title: "Password Updated", description: "Your password has been changed successfully." });
        passwordForm.reset();
    } catch (error: any) {
        console.error("Password change error:", error);
        toast({ title: "Password Change Failed", description: error.message || "Please check your current password.", variant: "destructive" });
    }
  }

  React.useEffect(() => {
    const isDarkMode = localStorage.getItem('theme') === 'dark' || 
                       (!('theme' in localStorage) && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    preferencesForm.setValue('darkMode', isDarkMode);
  }, [preferencesForm]);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setAvatarPreview(URL.createObjectURL(file));
      // In a real app, you'd upload this file to storage and update user.photoURL
      toast({ title: "Avatar Preview Updated", description: "To save, update your profile (actual upload not implemented in demo)." });
    }
  };

  const handleDeleteAccount = async () => {
    const user = auth.currentUser;
    if (user) {
        try {
            // Note: Deleting a user is a sensitive operation. 
            // In a real app, you'd re-authenticate first.
            // await user.delete(); // This is the Firebase delete call
            console.log("Account deletion requested for user:", user.uid);
            toast({
                title: "Account Deletion Initiated (Demo)",
                description: "Your account would be deleted. Logging you out.",
                variant: "destructive"
            });
             // For demo, sign out and redirect
             await auth.signOut();
             router.push('/auth/signup');

        } catch (error: any) {
            console.error("Delete account error:", error);
            toast({
                title: "Account Deletion Failed",
                description: error.message || "Could not delete account.",
                variant: "destructive"
            });
        }
    } else {
         toast({ title: "Error", description: "No user logged in.", variant: "destructive" });
    }
  };


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account, preferences, and app settings.
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 mb-6">
          <TabsTrigger value="profile"><UserCircle className="mr-2 h-4 w-4 inline-block" />Profile</TabsTrigger>
          <TabsTrigger value="preferences"><SlidersHorizontal className="mr-2 h-4 w-4 inline-block" />Preferences</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="mr-2 h-4 w-4 inline-block" />Notifications</TabsTrigger>
          <TabsTrigger value="integrations" id="integrations"><LinkIcon className="mr-2 h-4 w-4 inline-block" />Integrations</TabsTrigger>
          <TabsTrigger value="security"><ShieldCheck className="mr-2 h-4 w-4 inline-block" />Security</TabsTrigger>
          <TabsTrigger value="billing" id="billing"><CreditCard className="mr-2 h-4 w-4 inline-block" />Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal details.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                  <div className="flex items-center space-x-4 mb-6">
                    <Avatar className="h-20 w-20">
                       <AvatarImage src={avatarPreview || currentUserAvatar || `https://picsum.photos/seed/${currentUserEmail || 'avatar-settings'}/200/200`} alt="User Avatar" data-ai-hint="person avatar" />
                      <AvatarFallback><UserCircle size={40}/></AvatarFallback>
                    </Avatar>
                    <Button variant="outline" type="button" onClick={() => document.getElementById('avatar-upload')?.click()}>
                        <Camera className="mr-2 h-4 w-4" />Change Avatar
                    </Button>
                    <Input id="avatar-upload" type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                  </div>
                  <FormField
                    control={profileForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="your@email.com" {...field} disabled />
                        </FormControl>
                         <FormDescription>This is the email for login and notifications. It cannot be changed here.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={profileForm.control}
                    name="timezone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Timezone</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your timezone" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="America/New_York">Eastern Time (US & Canada)</SelectItem>
                            <SelectItem value="America/Chicago">Central Time (US & Canada)</SelectItem>
                            <SelectItem value="America/Denver">Mountain Time (US & Canada)</SelectItem>
                            <SelectItem value="America/Los_Angeles">Pacific Time (US & Canada)</SelectItem>
                            <SelectItem value="Europe/London">London (GMT)</SelectItem>
                            <SelectItem value="Europe/Berlin">Berlin (CET)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit">Save Profile</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>App Preferences</CardTitle>
              <CardDescription>Customize your WakeSync experience.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...preferencesForm}>
                <form onSubmit={preferencesForm.handleSubmit(onPreferencesSubmit)} className="space-y-6">
                  <FormField
                    control={preferencesForm.control}
                    name="darkMode"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Dark Mode</FormLabel>
                          <FormDescription>
                            Enable dark theme for the application. (Syncs with global theme toggle)
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
                  <FormField
                    control={preferencesForm.control}
                    name="defaultWakeUpSound"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Wake-Up Sound</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select default sound" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="nature_sounds">Nature Sounds</SelectItem>
                            <SelectItem value="gentle_flute">Gentle Flute</SelectItem>
                            <SelectItem value="ocean_waves">Ocean Waves</SelectItem>
                            <SelectItem value="birds_chirping">Birds Chirping</SelectItem>
                            <SelectItem value="none">None (Silent)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit">Save Preferences</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Manage how you receive alerts and updates.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <Form {...preferencesForm}> 
                    <form onSubmit={preferencesForm.handleSubmit(onPreferencesSubmit)} className="space-y-6">
                        <FormField
                            control={preferencesForm.control}
                            name="notifications.email"
                            render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                <FormLabel className="text-base">Email Notifications</FormLabel>
                                <FormDescription>
                                    Receive important updates and summaries via email.
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
                        <FormField
                            control={preferencesForm.control}
                            name="notifications.push"
                            render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                <FormLabel className="text-base">In-App Notifications</FormLabel>
                                <FormDescription>
                                    Get real-time alerts within the WakeSync app.
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
                        <Button type="submit">Save Notification Settings</Button>
                    </form>
                 </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>Connected Accounts & Integrations</CardTitle>
              <CardDescription>Link WakeSync with other services for an enhanced experience.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src="https://picsum.photos/seed/google-fit-logo/40/40" alt="Google Fit Logo" className="h-8 w-8 rounded-full" data-ai-hint="Google Fit logo" />
                    <div>
                      <h4 className="font-medium">Google Fit</h4>
                      <p className="text-xs text-muted-foreground">Sync sleep, activity, and heart rate data.</p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => toast({title: "Connect Google Fit (Demo)", description:"Integration flow would start here."})}>Connect</Button>
                </div>
              </Card>
              <Card className="p-4">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src="https://picsum.photos/seed/apple-health-logo/40/40" alt="Apple Health Logo" className="h-8 w-8 rounded-full" data-ai-hint="Apple Health logo" />
                        <div>
                        <h4 className="font-medium">Apple Health</h4>
                        <p className="text-xs text-muted-foreground">Import health data from your Apple devices.</p>
                        </div>
                    </div>
                    <Button variant="outline" onClick={() => toast({title: "Connect Apple Health (Demo)", description:"Integration flow would start here."})}>Connect (Demo)</Button>
                 </div>
              </Card>
               <Card className="p-4">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src="https://picsum.photos/seed/spotify-logo/40/40" alt="Spotify Logo" className="h-8 w-8 rounded-full" data-ai-hint="Spotify logo" />
                        <div>
                        <h4 className="font-medium">Spotify</h4>
                        <p className="text-xs text-muted-foreground">Use your Spotify playlists for wake-up sounds.</p>
                        </div>
                    </div>
                    <Button variant="outline" onClick={() => toast({title: "Connect Spotify (Demo)", description:"Integration flow would start here."})}>Connect</Button>
                 </div>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your account security.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                    <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Current Password</FormLabel>
                            <FormControl><Input type="password" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl><Input type="password" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={passwordForm.control}
                        name="confirmNewPassword"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <FormControl><Input type="password" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <Button type="submit">Change Password</Button>
                </form>
              </Form>
              <div className="mt-6 border-t pt-6">
                <h3 className="text-lg font-medium">Two-Factor Authentication (2FA)</h3>
                <p className="text-sm text-muted-foreground mb-2">Add an extra layer of security to your account.</p>
                <Button variant="outline" onClick={() => toast({title: "Enable 2FA (Demo)", description:"2FA setup flow would start here."})}>Enable 2FA (Demo)</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Billing & Subscription</CardTitle>
              <CardDescription>Manage your WakeSync subscription and payment methods.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h3 className="text-md font-medium">Current Plan: <span className="text-primary">Pro Monthly</span></h3>
                    <p className="text-sm text-muted-foreground">Renews on August 28, 2024. $9.99/month.</p>
                    <div className="flex gap-2 mt-2">
                        <Button variant="outline" onClick={() => toast({title: "Change Plan (Demo)", description:"Plan selection would be shown here."})}>Change Plan</Button>
                        <Button variant="link" className="text-destructive hover:text-destructive/80" onClick={() => toast({title: "Cancel Subscription (Demo)", description:"Subscription cancellation flow."})}>Cancel Subscription</Button>
                    </div>
                </div>
                <div className="border-t pt-6">
                    <h3 className="text-md font-medium">Payment Method</h3>
                    <div className="flex items-center gap-2 mt-2 p-3 border rounded-md bg-secondary/50">
                        <CreditCard className="h-6 w-6 text-muted-foreground"/>
                        <span>Visa ending in **** 1234</span>
                        <Button variant="ghost" size="sm" className="ml-auto" onClick={() => toast({title: "Edit Payment (Demo)", description:"Payment method update form."})}>Edit</Button>
                    </div>
                     <Button variant="outline" className="mt-2" onClick={() => toast({title: "Add Payment Method (Demo)", description:"Form to add new payment method."})}>Add New Payment Method</Button>
                </div>
                 <div className="border-t pt-6">
                    <h3 className="text-md font-medium">Billing History</h3>
                     <p className="text-sm text-muted-foreground">No invoices yet. Your first invoice will appear here after your first billing cycle.</p>
                </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="border-destructive">
        <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2"><AlertTriangle/>Danger Zone</CardTitle>
            <CardDescription>These actions are permanent and cannot be undone.</CardDescription>
        </CardHeader>
        <CardContent>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive"><Trash2 className="mr-2 h-4 w-4"/>Delete Account</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your account
                        and remove all your data from our servers (this is a demo).
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                        Yes, delete my account
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <p className="text-xs text-muted-foreground mt-2">Deleting your account will remove all your settings, device configurations, routines, and historical data.</p>
        </CardContent>
      </Card>
    </div>
  );
}
