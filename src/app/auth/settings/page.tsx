
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { UserCircle, Bell, ShieldCheck, CreditCard, SlidersHorizontal, Link as LinkIcon, AlertTriangle, Trash2, Camera, Loader2, Activity, BarChart, Zap, Users, Settings as SettingsTabIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import React, { useState, useEffect } from "react";
// Import the general User type and specific auth methods from the conditional firebase.ts
import { auth, db, storage, type User, getEmailProviderCredential, serverTimestamp, Timestamp } from "@/lib/firebase"; 
import { useRouter } from 'next/navigation';
import { apiClient } from "@/lib/apiClient"; 
// Assuming UserSettings type is defined in a shared location or backend models
// For demo, let's define a simplified one here if not available from backend models.
interface UserSettingsFromAPI { // Renamed to avoid conflict if UserSettings is imported from elsewhere
  userId: string;
  theme: 'light' | 'dark' | 'system'; 
  notifications: {
    email: boolean;
    push: boolean;
  };
  timezone: string;
  createdAt: any; // Can be Firebase Timestamp or string
  updatedAt: any; // Can be Firebase Timestamp or string
}


const profileFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(50, "Name cannot exceed 50 characters."),
  email: z.string().email("Invalid email address.").optional(), 
});

const preferencesFormSchema = z.object({
  theme: z.enum(['light', 'dark', 'system'], {required_error: "Theme selection is required."}),
  notifications: z.object({
    email: z.boolean().default(true),
    push: z.boolean().default(true),
  }),
  timezone: z.string().min(1, "Timezone is required."),
});

const passwordFormSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required.").optional().or(z.literal('')),
    newPassword: z.string().min(8, "New password must be at least 8 characters.").optional().or(z.literal('')),
    confirmNewPassword: z.string().optional().or(z.literal('')),
}).refine(data => {
    if (data.newPassword && data.newPassword.length > 0) {
        return data.newPassword === data.confirmNewPassword;
    }
    return true; 
}, {
    message: "New passwords don't match.",
    path: ["confirmNewPassword"],
}).refine(data => {
    if (data.newPassword && data.newPassword.length > 0 && (!data.currentPassword || data.currentPassword.length === 0)) {
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
  const [avatarFile, setAvatarFile] = useState<File | null>(null); // Store the file for upload
  
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isLoadingGlobal, setIsLoadingGlobal] = useState(true);
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
      timezone: "UTC", 
    },
  });
  
  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmNewPassword: "" },
  });

  // Effect for loading user data and settings
 useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setIsLoadingGlobal(true);
      if (user) {
        setFirebaseUser(user as User); // Cast to avoid type issues if mock/real differ slightly
        profileForm.reset({ name: user.displayName || "", email: user.email || "Not available" });
        setAvatarPreview(user.photoURL);

        setSettingsError(null);
        try {
          // Fetch settings from Firestore or backend API
          // Using Firestore example:
          const settingsRef = db.collection("userSettings").doc(user.uid);
          const settingsSnap = await settingsRef.get();
          if (settingsSnap.exists()) {
            const userSettings = settingsSnap.data() as UserSettingsFromAPI;
            preferencesForm.reset({
              theme: userSettings.theme,
              notifications: userSettings.notifications,
              timezone: userSettings.timezone,
            });
          } else {
            console.log("No user settings found in DB, using defaults.");
            // If no settings, could initialize them here with defaults and save
            const defaultSettings = {
              theme: 'system',
              notifications: { email: true, push: true },
              timezone: 'UTC',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              userId: user.uid,
            };
            preferencesForm.reset(defaultSettings);
            // Optionally save defaults to DB: await settingsRef.set(defaultSettings);
          }
        } catch (err) {
          const errorMsg = (err as Error).message || "Could not load your preferences.";
          setSettingsError(errorMsg + " Using defaults.");
          toast({ title: "Preferences Load Failed", description: errorMsg, variant: "destructive"});
           preferencesForm.reset({
            theme: 'system',
            notifications: { email: true, push: true },
            timezone: 'UTC',
          });
        }
      } else {
        toast({ title: "Not Authenticated", description: "Please login to access settings.", variant: "destructive" });
        router.push("/auth/login");
      }
      setIsLoadingGlobal(false);
    });
     return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]); // profileForm, preferencesForm removed from deps to avoid re-triggering fetch on form state change

  // Effect for theme changes
  useEffect(() => {
    const currentTheme = preferencesForm.watch('theme');
    if (typeof window !== 'undefined' && firebaseUser) { 
      document.documentElement.classList.remove('light', 'dark');
      if (currentTheme === 'dark') {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else if (currentTheme === 'light') {
        document.documentElement.classList.add('light');
        localStorage.setItem('theme', 'light');
      } else { // system
        localStorage.removeItem('theme'); 
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) document.documentElement.classList.add('dark');
        else document.documentElement.classList.add('light');
      }
    }
  }, [preferencesForm.watch('theme'), firebaseUser]);


  async function onProfileSubmit(values: z.infer<typeof profileFormSchema>) {
    if (!firebaseUser || !auth.currentUser) { // Check auth.currentUser as well
        toast({ title: "Error", description: "User not authenticated.", variant: "destructive"});
        return;
    }
    profileForm.formState.isSubmitting; 
    try {
        let photoURLToUpdate = firebaseUser.photoURL;
        if (avatarFile) {
          // Upload to Firebase Storage (or mock storage)
          const storageRef = storage.ref(`avatars/${firebaseUser.uid}/${avatarFile.name}`);
          const uploadTask = await storageRef.put(avatarFile);
          photoURLToUpdate = await uploadTask.ref.getDownloadURL();
          setAvatarPreview(photoURLToUpdate); // Update preview with final URL
          setAvatarFile(null); // Clear file after upload
        }

        // Uses conditional firebaseUpdateProfile from lib/firebase.ts
        await auth.updateProfile(auth.currentUser as User, { displayName: values.name, photoURL: photoURLToUpdate });
        
        // Update local state for immediate reflection if firebase.ts mock doesn't trigger onAuthStateChanged for profile updates
        setFirebaseUser(prev => prev ? {...prev, displayName: values.name, photoURL: photoURLToUpdate } : null);

        // Optionally, update display name in Firestore user profile document if you store it there too
        // const userDocRef = db.collection("users").doc(firebaseUser.uid);
        // await userDocRef.update({ displayName: values.name, photoURL: photoURLToUpdate });

        toast({ title: "Profile Updated", description: "Your profile information has been saved." });
    } catch (error: any) {
        console.error("Profile update error:", error);
        toast({ title: "Profile Update Failed", description: error.message || "Could not update profile.", variant: "destructive" });
    }
  }

  async function onPreferencesSubmit(values: z.infer<typeof preferencesFormSchema>) {
    if (!firebaseUser) {
      toast({ title: "Error", description: "User not authenticated.", variant: "destructive"});
      return;
    }
    preferencesForm.formState.isSubmitting; 
    try {
      // Using Firestore example:
      const settingsRef = db.collection("userSettings").doc(firebaseUser.uid);
      await settingsRef.set({
        ...values,
        userId: firebaseUser.uid,
        updatedAt: serverTimestamp(), // Use serverTimestamp for real Firebase
      }, { merge: true }); // Merge to not overwrite createdAt

      toast({ title: "Preferences Updated", description: "Your app preferences have been saved." });
    } catch (error: any) {
      console.error("Preferences update error:", error);
      toast({ title: "Preferences Update Failed", description: error.message || "Could not save preferences.", variant: "destructive" });
    }
  }
  
  async function onPasswordSubmit(values: z.infer<typeof passwordFormSchema>) {
    if (!firebaseUser || !firebaseUser.email || !auth.currentUser) {
        toast({ title: "Error", description: "User not found or email not available.", variant: "destructive" });
        return;
    }
    if (!values.newPassword && !values.currentPassword) {
        toast({ title: "Password Not Changed", description: "No password information provided.", variant: "default"});
        return;
    }
     if (!values.currentPassword && values.newPassword) { 
        passwordForm.setError("currentPassword", {message: "Current password is required to set a new one."})
        return;
    }
     if (!values.newPassword && values.currentPassword) {
        toast({ title: "Password Not Changed", description: "Please enter a new password to make changes.", variant: "default"});
        return;
    }

    passwordForm.formState.isSubmitting;
    try {
        // Construct credential using the conditionally exported getEmailProviderCredential
        const credential = getEmailProviderCredential(firebaseUser.email, values.currentPassword!);
        // Reauthenticate
        await auth.reauthenticateWithCredential(auth.currentUser as User, credential);
        // Update password
        await auth.updatePassword(auth.currentUser as User, values.newPassword!);

        toast({ title: "Password Updated", description: "Your password has been changed successfully." });
        passwordForm.reset({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
    } catch (error: any) {
        console.error("Password change error:", error);
        let userFriendlyMessage = error.message || "Password change failed. Please check your current password.";
        if (error.code === 'auth/wrong-password' || error.message?.includes("wrong-password") || error.message?.includes("Incorrect current password")) { // Accommodate mock errors
            userFriendlyMessage = "Incorrect current password. Please try again.";
        } else if (error.code === 'auth/too-many-requests' || error.message?.includes("too-many-requests")) {
            userFriendlyMessage = "Too many attempts. Please try again later.";
        }
        toast({ title: "Password Change Failed", description: userFriendlyMessage, variant: "destructive" });
    }
  }

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.size > 2 * 1024 * 1024) { 
        toast({ title: "Image Too Large", description: "Please select an image smaller than 2MB.", variant: "destructive"});
        return;
      }
      setAvatarFile(file); // Store the file
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteAccount = async () => {
    if (firebaseUser && auth.currentUser) {
        try {
            console.log("Account deletion requested for user:", firebaseUser.uid);
            // In a real app, you might re-authenticate before deletion for security.
            // For mock:
            // await auth.currentUser.delete(); // If delete method is on mock user
            // Or just sign out and remove from mock store
            const userEmailToDelete = firebaseUser.email;
            await auth.signOut(auth); // This will call the mock signOut

            // If using mockUserStore directly for deletion (depends on mockAuthSingleton internal implementation)
            if (userEmailToDelete && mockUserStore[userEmailToDelete]) {
                 delete mockUserStore[userEmailToDelete];
                 console.log(`[MockAuth] User ${userEmailToDelete} removed from mockUserStore.`);
            }

            toast({
                title: "Account Deletion Initiated",
                description: "You have been logged out. In a real app, your account and data would be scheduled for deletion.",
                variant: "destructive"
            });
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


  if (isLoadingGlobal) {
     return (
         <div className="flex items-center justify-center p-10 h-[calc(100vh-200px)]">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Loading user data...</span>
         </div>
      );
  }

  return (
    <div className="space-y-8 p-4 md:p-6 lg:p-8">
      <div className="flex items-center gap-3">
        <SettingsTabIcon className="h-8 w-8 text-primary" />
        <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">
            Manage your account, preferences, and app settings.
            </p>
        </div>
      </div>

      {firebaseUser && ( 
        <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 mb-6 overflow-x-auto no-scrollbar">
            <TabsTrigger value="profile"><UserCircle className="mr-2 h-4 w-4 inline-block" />Profile</TabsTrigger>
            <TabsTrigger value="preferences"><SlidersHorizontal className="mr-2 h-4 w-4 inline-block" />Preferences</TabsTrigger>
            <TabsTrigger value="notifications"><Bell className="mr-2 h-4 w-4 inline-block" />Notifications</TabsTrigger>
            <TabsTrigger value="integrations" id="integrations"><LinkIcon className="mr-2 h-4 w-4 inline-block" />Integrations</TabsTrigger>
            <TabsTrigger value="security"><ShieldCheck className="mr-2 h-4 w-4 inline-block" />Security</TabsTrigger>
            <TabsTrigger value="billing" id="billing"><CreditCard className="mr-2 h-4 w-4 inline-block" />Billing</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
            <Card className="shadow-md">
                <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal details.</CardDescription>
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
                        <Input id="avatar-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleAvatarChange} />
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
            <Card className="shadow-md">
                <CardHeader>
                <CardTitle>App Preferences</CardTitle>
                <CardDescription>Customize your WakeSync experience.</CardDescription>
                </CardHeader>
                <CardContent>
                {(isLoadingGlobal || preferencesForm.formState.isSubmitting) && !settingsError && ( 
                    <div className="flex items-center justify-center p-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /><span className="ml-2">Loading/Saving preferences...</span></div>
                )}
                {settingsError && (
                    <div className="text-destructive p-4 border border-destructive bg-destructive/10 rounded-md">{settingsError}</div>
                )}
                {!isLoadingGlobal && !settingsError && ( 
                <Form {...preferencesForm}>
                    <form onSubmit={preferencesForm.handleSubmit(onPreferencesSubmit)} className="space-y-6">
                    <FormField
                        control={preferencesForm.control}
                        name="theme"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Theme</FormLabel>
                             <Select onValueChange={field.onChange} value={field.value}>
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
                            <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Select your timezone" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="UTC">UTC</SelectItem>
                                <SelectItem value="America/New_York">Eastern Time (US & Canada)</SelectItem>
                                <SelectItem value="America/Chicago">Central Time (US & Canada)</SelectItem>
                                <SelectItem value="America/Denver">Mountain Time (US & Canada)</SelectItem>
                                <SelectItem value="America/Los_Angeles">Pacific Time (US & Canada)</SelectItem>
                                <SelectItem value="Europe/London">London (GMT/BST)</SelectItem>
                                <SelectItem value="Europe/Berlin">Berlin (CET/CEST)</SelectItem>
                                <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
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
            <Card className="shadow-md">
                <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Manage how you receive alerts and updates.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                {(isLoadingGlobal || preferencesForm.formState.isSubmitting) && !settingsError && (
                     <div className="flex items-center justify-center p-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /><span className="ml-2">Loading/Saving notification settings...</span></div>
                )}
                {settingsError && (
                    <div className="text-destructive p-4 border border-destructive bg-destructive/10 rounded-md">{settingsError}</div>
                )}
                {!isLoadingGlobal && !settingsError && (
                    <Form {...preferencesForm}> 
                        <form onSubmit={preferencesForm.handleSubmit(onPreferencesSubmit)} className="space-y-6">
                            <FormField
                                control={preferencesForm.control}
                                name="notifications.email"
                                render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm bg-background hover:bg-muted/30 transition-colors">
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
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm bg-background hover:bg-muted/30 transition-colors">
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
            <Card className="shadow-md">
                <CardHeader>
                <CardTitle>Connected Accounts & Integrations</CardTitle>
                <CardDescription>Link WakeSync with other services for an enhanced experience.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                <Card className="p-4 hover:shadow-lg transition-shadow">
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
                <Card className="p-4 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <BarChart className="h-8 w-8 text-gray-500" />
                            <div>
                            <h4 className="font-medium">Apple Health</h4>
                            <p className="text-xs text-muted-foreground">Import health data from your Apple devices.</p>
                            </div>
                        </div>
                        <Button variant="outline" onClick={() => toast({title: "Connect Apple Health (Demo)", description:"Integration flow would start here."})}>Connect</Button>
                    </div>
                </Card>
                <Card className="p-4 hover:shadow-lg transition-shadow">
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
                <Card className="p-4 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Users className="h-8 w-8 text-blue-500" />
                            <div>
                            <h4 className="font-medium">Google Calendar</h4>
                            <p className="text-xs text-muted-foreground">Integrate your calendar for smarter routine suggestions.</p>
                            </div>
                        </div>
                        <Button variant="outline" onClick={() => toast({title: "Connect Google Calendar (Demo)", description:"Integration flow would start here."})}>Connect</Button>
                    </div>
                </Card>
                </CardContent>
            </Card>
            </TabsContent>

            <TabsContent value="security">
            <Card className="shadow-md">
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
                                <FormControl><Input type="password" {...field} placeholder="Enter your current password" /></FormControl>
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
                                <FormControl><Input type="password" {...field} placeholder="Enter new password (min. 8 characters)" /></FormControl>
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
                                <FormControl><Input type="password" {...field} placeholder="Confirm your new password" /></FormControl>
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
                <div className="mt-8 border-t pt-6">
                    <h3 className="text-lg font-medium">Two-Factor Authentication (2FA)</h3>
                    <p className="text-sm text-muted-foreground mb-3">Add an extra layer of security to your account.</p>
                    <Button variant="outline" onClick={() => toast({title: "Enable 2FA (Demo)", description:"2FA setup flow would start here."})}>Enable 2FA</Button>
                </div>
                <div className="mt-8 border-t pt-6">
                    <h3 className="text-lg font-medium">Active Sessions</h3>
                    <p className="text-sm text-muted-foreground mb-3">Review and manage devices logged into your account.</p>
                    <Card className="p-3 space-y-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Chrome on Mac OS X (Current)</p>
                                <p className="text-xs text-muted-foreground">Last active: Just now &bull; IP: 123.45.67.89</p>
                            </div>
                            <Button variant="link" size="sm" className="text-destructive hover:text-destructive/80" onClick={() => toast({title:"Session Terminated (Demo)"})}>Log out</Button>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">WakeSync iOS App</p>
                                <p className="text-xs text-muted-foreground">Last active: 2 days ago &bull; IP: 98.76.54.32</p>
                            </div>
                            <Button variant="link" size="sm" className="text-destructive hover:text-destructive/80" onClick={() => toast({title:"Session Terminated (Demo)"})}>Log out</Button>
                        </div>
                    </Card>
                    <Button variant="outline" className="mt-3" onClick={() => toast({title:"Logged out all other sessions (Demo)"})}>Log Out All Other Sessions</Button>
                </div>
                </CardContent>
            </Card>
            </TabsContent>
            
            <TabsContent value="billing">
            <Card className="shadow-md">
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
                        <div className="flex items-center gap-3 mt-2 p-3 border rounded-md bg-secondary/50">
                            <CreditCard className="h-6 w-6 text-muted-foreground"/>
                            <div>
                                <span className="font-medium">Visa ending in **** 1234</span>
                                <p className="text-xs text-muted-foreground">Expires 12/2026</p>
                            </div>
                            <Button variant="ghost" size="sm" className="ml-auto hover:bg-muted" onClick={() => toast({title: "Edit Payment (Demo)", description:"Payment method update form."})}>Edit</Button>
                        </div>
                        <Button variant="outline" className="mt-2" onClick={() => toast({title: "Add Payment Method (Demo)", description:"Form to add new payment method."})}>Add New Payment Method</Button>
                    </div>
                    <div className="border-t pt-6">
                        <h3 className="text-md font-medium">Billing History</h3>
                        <p className="text-sm text-muted-foreground">No invoices yet. Your first invoice will appear here after your first billing cycle.</p>
                         <Button variant="link" size="sm" className="mt-1 px-0" onClick={() => toast({title:"View All Invoices (Demo)"})}>View All Invoices</Button>
                    </div>
                </CardContent>
            </Card>
            </TabsContent>
            <Card className="border-destructive mt-8 shadow-md">
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
                            and remove all your data from our servers (this is a mock demo).
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

