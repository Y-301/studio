
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; // Keep this for non-form labels if any
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { UserCircle, Bell, ShieldCheck, CreditCard, SlidersHorizontal, Link as LinkIcon, AlertTriangle, Trash2, Camera, Loader2, Activity, BarChart, Zap, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import React, { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential, type User as FirebaseUser } from "firebase/auth";
import { useRouter } from 'next/navigation';
import { apiClient } from "@/lib/apiClient"; // Import API client
import type { UserSettings } from "@/backend/src/models/settings"; // Import type from backend


const profileFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address.").optional(), // Email is display-only from Firebase
  // Timezone is part of UserSettings, not directly Firebase profile
});

// Corresponds to UserSettings model from backend, but for form use
const preferencesFormSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  notifications: z.object({
    email: z.boolean().default(true),
    push: z.boolean().default(true),
  }),
  timezone: z.string().min(1, "Timezone is required."),
  // defaultWakeUpSound: z.string().optional(), // If this is part of UserSettings
});

const passwordFormSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required.").optional().or(z.literal('')),
    newPassword: z.string().min(8, "New password must be at least 8 characters.").optional().or(z.literal('')),
    confirmNewPassword: z.string().optional().or(z.literal('')),
}).refine(data => {
    if (data.newPassword || data.confirmNewPassword) {
        return data.newPassword === data.confirmNewPassword;
    }
    return true;
}, {
    message: "New passwords don't match",
    path: ["confirmNewPassword"],
}).refine(data => {
    if (data.newPassword && !data.currentPassword) {
        return false;
    }
    return true;
}, {
    message: "Current password is required to set a new password.",
    path: ["currentPassword"],
});


export default function SettingsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [settingsError, setSettingsError] = useState<string | null>(null);


  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { name: "" },
  });

  const preferencesForm = useForm<z.infer<typeof preferencesFormSchema>>({
    resolver: zodResolver(preferencesFormSchema),
    defaultValues: {
      theme: 'system', 
      notifications: { email: true, push: true },
      timezone: "America/New_York",
    },
  });
  
  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmNewPassword: "" },
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setFirebaseUser(user);
        profileForm.setValue("name", user.displayName || "");
        profileForm.setValue("email", user.email || "Not available");
        setAvatarPreview(user.photoURL);

        // Fetch user settings from backend
        setIsLoadingSettings(true);
        setSettingsError(null);
        try {
          // Backend uses a mock user ID 'user1' for now. 
          // TODO: Pass actual user.uid once backend auth is set up.
          const userSettings = await apiClient<UserSettings>(`/settings/user1`); 
          preferencesForm.reset({
            theme: userSettings.theme,
            notifications: userSettings.notifications,
            timezone: userSettings.timezone,
          });
        } catch (err) {
          setSettingsError("Failed to load preferences. Using defaults.");
          toast({ title: "Error", description: "Could not load your preferences.", variant: "destructive"});
        } finally {
          setIsLoadingSettings(false);
        }

      } else {
        toast({ title: "Not Authenticated", description: "Please login to access settings.", variant: "destructive" });
        router.push("/auth/login");
      }
    });
     return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]); // Removed forms from deps to avoid re-fetch loops

  useEffect(() => {
    // Sync theme with localStorage and OS preference if 'system'
    const currentTheme = preferencesForm.getValues('theme');
    if (typeof window !== 'undefined') {
      if (currentTheme === 'dark') {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else if (currentTheme === 'light') {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      } else { // system
        localStorage.removeItem('theme'); // Let OS decide
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
      }
    }
  }, [preferencesForm.watch('theme')]);


  async function onProfileSubmit(values: z.infer<typeof profileFormSchema>) {
    if (!firebaseUser) {
        toast({ title: "Error", description: "User not authenticated.", variant: "destructive"});
        return;
    }
    try {
        await updateProfile(firebaseUser, { displayName: values.name, photoURL: avatarPreview || firebaseUser.photoURL });
        toast({ title: "Profile Updated", description: "Your Firebase profile information has been saved." });
    } catch (error: any) {
        console.error("Profile update error:", error);
        toast({ title: "Profile Update Failed", description: error.message, variant: "destructive" });
    }
  }

  async function onPreferencesSubmit(values: z.infer<typeof preferencesFormSchema>) {
    if (!firebaseUser) {
      toast({ title: "Error", description: "User not authenticated.", variant: "destructive"});
      return;
    }
    try {
      // Backend uses mock user ID 'user1' for now.
      // TODO: Pass actual firebaseUser.uid once backend auth is setup.
      await apiClient<UserSettings>(`/settings/user1`, {
        method: 'PUT',
        body: JSON.stringify(values),
      });
      toast({ title: "Preferences Updated", description: "Your app preferences have been saved." });
    } catch (error: any) {
      console.error("Preferences update error:", error);
      toast({ title: "Preferences Update Failed", description: error.message, variant: "destructive" });
    }
  }
  
  async function onPasswordSubmit(values: z.infer<typeof passwordFormSchema>) {
    if (!firebaseUser || !firebaseUser.email) {
        toast({ title: "Error", description: "User not found or email not available.", variant: "destructive" });
        return;
    }
    if (!values.currentPassword || !values.newPassword) {
        toast({ title: "Skipped", description: "Password not changed as new password was not provided.", variant: "default"});
        return;
    }
    try {
        const credential = EmailAuthProvider.credential(firebaseUser.email, values.currentPassword);
        await reauthenticateWithCredential(firebaseUser, credential);
        await updatePassword(firebaseUser, values.newPassword);
        toast({ title: "Password Updated", description: "Your password has been changed successfully." });
        passwordForm.reset();
    } catch (error: any) {
        console.error("Password change error:", error);
        toast({ title: "Password Change Failed", description: error.message || "Please check your current password.", variant: "destructive" });
    }
  }

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
        toast({ title: "Avatar Preview Updated", description: "Click 'Save Profile' to apply changes." });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteAccount = async () => {
    if (firebaseUser) {
        try {
            // This is a demo, so we just simulate and sign out.
            // In a real app: await firebaseUser.delete();
            console.log("Account deletion requested for user:", firebaseUser.uid);
            toast({
                title: "Account Deletion Initiated (Demo)",
                description: "Your account would be deleted. Logging you out.",
                variant: "destructive"
            });
             await auth.signOut();
             router.push('/auth/signup');
        } catch (error: any) {
            console.error("Delete account error:", error);
            toast({ title: "Account Deletion Failed", description: error.message || "Could not delete account.", variant: "destructive" });
        }
    } else {
         toast({ title: "Error", description: "No user logged in.", variant: "destructive" });
    }
  };

  const CurrentUserAvatarFallback = () => {
    if (!firebaseUser) return <UserCircle size={40}/>;
    return firebaseUser.displayName ? firebaseUser.displayName.charAt(0).toUpperCase() : (firebaseUser.email ? firebaseUser.email.charAt(0).toUpperCase() : <UserCircle size={40}/>);
  };


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account, preferences, and app settings.
        </p>
      </div>

      {(isLoadingSettings && !firebaseUser) && ( // Show main loader only if firebaseUser is also not yet available
         <div className="flex items-center justify-center p-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Loading user data...</span>
         </div>
      )}

      {firebaseUser && ( // Render tabs only if firebaseUser is available
        <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 mb-6 overflow-x-auto">
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
                <CardDescription>Update your personal details (Stored in Firebase).</CardDescription>
                </CardHeader>
                <CardContent>
                <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                    <div className="flex items-center space-x-4 mb-6">
                        <Avatar className="h-20 w-20">
                        <AvatarImage src={avatarPreview || undefined} alt={firebaseUser?.displayName || "User Avatar"} />
                        <AvatarFallback><CurrentUserAvatarFallback/></AvatarFallback>
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
                            <Input type="email" {...field} disabled />
                            </FormControl>
                            <FormDescription>Login email. Cannot be changed here.</FormDescription>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                        {profileForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Save Profile
                    </Button>
                    </form>
                </Form>
                </CardContent>
            </Card>
            </TabsContent>

            <TabsContent value="preferences">
            <Card>
                <CardHeader>
                <CardTitle>App Preferences</CardTitle>
                <CardDescription>Customize your WakeSync experience (Stored via Backend).</CardDescription>
                </CardHeader>
                <CardContent>
                {isLoadingSettings ? (
                    <div className="flex items-center justify-center p-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /><span className="ml-2">Loading preferences...</span></div>
                ) : settingsError ? (
                    <div className="text-destructive p-4 border border-destructive bg-destructive/10 rounded-md">{settingsError}</div>
                ) : (
                <Form {...preferencesForm}>
                    <form onSubmit={preferencesForm.handleSubmit(onPreferencesSubmit)} className="space-y-6">
                    <FormField
                        control={preferencesForm.control}
                        name="theme"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Theme</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder="Select theme" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="light">Light</SelectItem>
                                    <SelectItem value="dark">Dark</SelectItem>
                                    <SelectItem value="system">System</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormDescription>Choose your preferred application theme.</FormDescription>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     <FormField
                        control={preferencesForm.control}
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
                    <Button type="submit" disabled={preferencesForm.formState.isSubmitting}>
                        {preferencesForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Save Preferences
                    </Button>
                    </form>
                </Form>
                )}
                </CardContent>
            </Card>
            </TabsContent>
            
            <TabsContent value="notifications">
            <Card>
                <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Manage how you receive alerts and updates (Stored via Backend).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                {isLoadingSettings ? (
                     <div className="flex items-center justify-center p-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /><span className="ml-2">Loading notification settings...</span></div>
                ) : settingsError ? (
                    <div className="text-destructive p-4 border border-destructive bg-destructive/10 rounded-md">{settingsError}</div>
                ) : (
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
                            <Button type="submit" disabled={preferencesForm.formState.isSubmitting}>
                                {preferencesForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                Save Notification Settings
                            </Button>
                        </form>
                    </Form>
                )}
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
                        <Activity className="h-8 w-8 text-red-500" />
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
                            <BarChart className="h-8 w-8 text-gray-500" />
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
                            <Zap className="h-8 w-8 text-green-500" />
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
                        <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
                            {passwordForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Change Password
                        </Button>
                    </form>
                </Form>
                <div className="mt-6 border-t pt-6">
                    <h3 className="text-lg font-medium">Two-Factor Authentication (2FA)</h3>
                    <p className="text-sm text-muted-foreground mb-2">Add an extra layer of security to your account.</p>
                    <Button variant="outline" onClick={() => toast({title: "Enable 2FA (Demo)", description:"2FA setup flow would start here."})}>Enable 2FA (Demo)</Button>
                </div>
                <div className="mt-6 border-t pt-6">
                    <h3 className="text-lg font-medium">Active Sessions</h3>
                    <p className="text-sm text-muted-foreground mb-2">Review and manage devices logged into your account.</p>
                    <Card className="p-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Chrome on Mac OS X (Current)</p>
                                <p className="text-xs text-muted-foreground">Last active: Just now</p>
                            </div>
                            <Button variant="link" size="sm" className="text-destructive" onClick={() => toast({title:"Session Terminated (Demo)"})}>Log out</Button>
                        </div>
                        <hr className="my-2"/>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">WakeSync iOS App</p>
                                <p className="text-xs text-muted-foreground">Last active: 2 days ago</p>
                            </div>
                            <Button variant="link" size="sm" className="text-destructive" onClick={() => toast({title:"Session Terminated (Demo)"})}>Log out</Button>
                        </div>
                    </Card>
                    <Button variant="outline" className="mt-2" onClick={() => toast({title:"Logged out all other sessions (Demo)"})}>Log Out All Other Sessions</Button>
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
            <Card className="border-destructive mt-8">
            <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2"><AlertTriangle/>Danger Zone</CardTitle>
                <CardDescription>These actions are permanent and cannot be undone.</CardDescription>
            </CardHeader>
            <CardContent>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={!firebaseUser}><Trash2 className="mr-2 h-4 w-4"/>Delete Account</Button>
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
        </Tabs>
      )}
    </div>
  );
}
