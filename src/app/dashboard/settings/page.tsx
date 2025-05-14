
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
import { UserCircle, Bell, ShieldCheck, CreditCard, SlidersHorizontal, Link as LinkIcon, AlertTriangle, Trash2, Camera, Loader2, Activity, BarChart, Zap, Users, Settings as SettingsTabIcon, FileSpreadsheet, Download, UploadCloud } from "lucide-react";
import { Separator } from "@/components/ui/separator" // Corrected import
import { useToast } from "@/hooks/use-toast";
import React, { useState, useEffect, useRef } from "react";
import { auth, User } from "@/lib/firebase"; 
import { useRouter } from 'next/navigation';
import { UserSettings as UserSettingsFromAPI } from '@/backend/src/models/settings'; 
import { apiClient } from "@/lib/apiClient";
import { useAppContext } from "@/contexts/AppContext";


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
  const { currentUser, isLoadingStatus: isLoadingAppContext, isAppInitialized, setIsDataFromCsv, setIsAppInitialized } = useAppContext();
  
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null); 
  
  // No local firebaseUser state, use currentUser from AppContext
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [selectedCsvFile, setSelectedCsvFile] = useState<File | null>(null);
  const [isUploadingCsv, setIsUploadingCsv] = useState(false);
  const csvFileInputRef = useRef<HTMLInputElement>(null);


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

 useEffect(() => {
    if (!isLoadingAppContext && currentUser) {
        profileForm.reset({ name: currentUser.displayName || "", email: currentUser.email || "Not available" });
        setAvatarPreview(currentUser.photoURL);

        setSettingsError(null);
        const fetchSettings = async () => {
            try {
              const userSettings = await apiClient<UserSettingsFromAPI>(`/settings/${currentUser.uid}`);
              if (userSettings && Object.keys(userSettings).length > 0) {
                 preferencesForm.reset({
                  theme: userSettings.theme,
                  notifications: userSettings.notifications,
                  timezone: userSettings.timezone,
                });
              } else {
                console.log("No user settings found in API, using defaults.");
                preferencesForm.reset({ theme: 'system', notifications: { email: true, push: true }, timezone: 'UTC' });
              }
            } catch (err) {
              const errorMsg = (err as Error).message || "Could not load your preferences.";
              setSettingsError(errorMsg + " Using defaults.");
              toast({ title: "Preferences Load Failed", description: errorMsg, variant: "destructive"});
               preferencesForm.reset({ theme: 'system', notifications: { email: true, push: true }, timezone: 'UTC' });
            }
        };
        fetchSettings();
    } else if (!isLoadingAppContext && !currentUser && isAppInitialized) {
      // App is initialized but no user, redirect to login
      router.push('/auth/login');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, isLoadingAppContext, isAppInitialized, router]); 


  useEffect(() => {
    const currentTheme = preferencesForm.watch('theme');
    if (typeof window !== 'undefined' && currentUser) { 
      document.documentElement.classList.remove('light', 'dark');
      if (currentTheme === 'dark') {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else if (currentTheme === 'light') {
        document.documentElement.classList.add('light');
        localStorage.setItem('theme', 'light');
      } else { 
        localStorage.removeItem('theme'); 
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) document.documentElement.classList.add('dark');
        else document.documentElement.classList.add('light');
      }
    }
  }, [preferencesForm.watch('theme'), currentUser]);


  async function onProfileSubmit(values: z.infer<typeof profileFormSchema>) {
    if (!currentUser || currentUser.uid === "guest-user") { 
        toast({ title: "Action Not Allowed", description: "Profile updates are disabled for guest users.", variant: "destructive"});
        return;
    }
    profileForm.formState.isSubmitting; 
    try {
        let photoURLToUpdate = currentUser.photoURL;
        if (avatarFile) { 
            // For local backend, actual file upload to backend would be needed.
            // This is a placeholder if storage isn't fully implemented in local backend.
            console.warn("Avatar file selected, but local backend storage upload needs full implementation.");
            // For demo, we can use a data URL or just update the name.
            // photoURLToUpdate = avatarPreview; 
            setAvatarFile(null);
            toast({ title: "Avatar Change (Conceptual)", description: "Avatar preview updated. Backend file upload needed for persistence."});
        }

        // Call the local auth.updateProfile which calls backend if implemented, or updates localStorage.
        await auth.updateProfile(currentUser as User, { displayName: values.name, photoURL: photoURLToUpdate });
        
        toast({ title: "Profile Updated", description: "Your profile information has been saved." });
    } catch (error: any) {
        console.error("Profile update error:", error);
        toast({ title: "Profile Update Failed", description: error.message || "Could not update profile.", variant: "destructive" });
    }
  }

  async function onPreferencesSubmit(values: z.infer<typeof preferencesFormSchema>) {
    if (!currentUser || currentUser.uid === "guest-user") {
      toast({ title: "Action Not Allowed", description: "Preference updates are disabled for guest users.", variant: "destructive"});
      return;
    }
    preferencesForm.formState.isSubmitting; 
    try {
      const dataToSave: Partial<UserSettingsFromAPI> = {
        theme: values.theme,
        notifications: values.notifications,
        timezone: values.timezone,
        // Backend will handle updatedAt
      };
      
      await apiClient(`/settings/${currentUser.uid}`, {
        method: 'PUT',
        body: JSON.stringify(dataToSave)
      });

      toast({ title: "Preferences Updated", description: "Your app preferences have been saved." });
    } catch (error: any) {
      console.error("Preferences update error:", error);
      toast({ title: "Preferences Update Failed", description: error.message || "Could not save preferences.", variant: "destructive" });
    }
  }
  
  async function onPasswordSubmit(values: z.infer<typeof passwordFormSchema>) {
    if (!currentUser || !currentUser.email || currentUser.uid === "guest-user") {
        toast({ title: "Action Not Allowed", description: "Password changes are disabled.", variant: "destructive" });
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
        toast({ title: "Password Not Changed", description: "Please enter a new password.", variant: "default"});
        return;
    }

    passwordForm.formState.isSubmitting;
    try {
        // Local backend's auth.updatePassword would handle reauth logic internally or require currentPassword.
        // For simplicity, sending all to backend if it needs it.
        await apiClient(`/auth/change-password`, { // Assuming a new backend endpoint
            method: 'POST',
            body: JSON.stringify({
                currentPassword: values.currentPassword,
                newPassword: values.newPassword
            })
        });

        toast({ title: "Password Updated", description: "Your password has been changed successfully." });
        passwordForm.reset({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
    } catch (error: any) {
        console.error("Password change error:", error);
        toast({ title: "Password Change Failed", description: error.message || "Could not change password.", variant: "destructive" });
    }
  }

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.size > 2 * 1024 * 1024) { 
        toast({ title: "Image Too Large", description: "Please select an image smaller than 2MB.", variant: "destructive"});
        return;
      }
      setAvatarFile(file); 
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteAccount = async () => {
    if (currentUser && currentUser.uid !== "guest-user") {
        try {
            // Backend should handle actual deletion. Frontend signs out.
            // await apiClient(`/users/${currentUser.uid}`, { method: 'DELETE' }); // Example
            await auth.signOut(auth); 
            toast({
                title: "Account Deletion Processed",
                description: "You have been logged out. Backend would handle full deletion.",
                variant: "destructive"
            });
             router.push('/auth/signup'); 
        } catch (error: any) {
            console.error("Delete account error:", error);
            toast({ title: "Account Deletion Failed", description: error.message || "Could not delete account.", variant: "destructive" });
        }
    } else {
         toast({ title: "Action Not Allowed", description: "Account deletion not available.", variant: "destructive" });
    }
  };
  
  const handleCsvFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedCsvFile(event.target.files[0]);
    } else {
      setSelectedCsvFile(null);
    }
  };

  const handleUploadCsv = async () => {
    if (!selectedCsvFile) {
      toast({ title: "No CSV File", description: "Please select a CSV file to upload.", variant: "destructive" });
      return;
    }
    if (!currentUser) {
      toast({ title: "Not Authenticated", description: "Please log in to upload data.", variant: "destructive" });
      return;
    }

    setIsUploadingCsv(true);
    const formData = new FormData();
    formData.append('deviceCsv', selectedCsvFile); // 'deviceCsv' must match backend multer field name

    try {
      // Assuming the CSV is for devices for this example
      const response = await apiClient<{ message: string; importedCount?: number }>('/data/upload-csv/devices', {
        method: 'POST',
        body: formData,
        headers: {
          // Content-Type is set automatically by browser for FormData
        },
      });
      toast({ title: "CSV Upload Successful", description: `${response.message} ${response.importedCount ? '('+response.importedCount+' devices)' : ''}` });
      setIsDataFromCsv(true); // Update global context
      if (csvFileInputRef.current) {
        csvFileInputRef.current.value = ""; // Reset file input
      }
      setSelectedCsvFile(null);
    } catch (error: any) {
      toast({ title: "CSV Upload Failed", description: error.message || "Could not upload CSV.", variant: "destructive" });
    } finally {
      setIsUploadingCsv(false);
    }
  };

  const handleDownloadCsv = async (dataType: 'devices' /* | 'routines' etc. */) => {
     if (!currentUser) {
      toast({ title: "Not Authenticated", description: "Please log in to download data.", variant: "destructive" });
      return;
    }
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/data/export-csv/${dataType}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('wakeSyncToken')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({message: response.statusText}));
        throw new Error(errorData.message || `Failed to download CSV: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wakesync_${dataType}_export.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast({ title: "CSV Download Started", description: `Your ${dataType} data CSV is being downloaded.`});
    } catch (error: any) {
       toast({ title: "CSV Download Failed", description: error.message, variant: "destructive" });
    }
  };


  const CurrentUserAvatarFallback = () => {
    if (!currentUser) return <UserCircle size={40}/>;
    return currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : (currentUser.email ? currentUser.email.charAt(0).toUpperCase() : <UserCircle size={40}/>);
  };


  if (isLoadingAppContext) {
     return (
         <div className="flex items-center justify-center p-10 h-[calc(100vh-200px)]">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Loading user data...</span>
         </div>
      );
  }

  const isGuest = !currentUser; // Simplified guest check for local mode

  return (
    <div className="space-y-8 p-4 md:p-6 lg:p-8">
      <div className="flex items-center gap-3">
        <SettingsTabIcon className="h-8 w-8 text-primary" />
        <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">
            Manage your account, preferences, and app settings. {isGuest && "(Read-only Mode - Please Login/Signup)"}
            </p>
        </div>
      </div>

      {currentUser && ( 
        <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-7 mb-6 overflow-x-auto no-scrollbar"> {/* Adjusted grid for more tabs */}
            <TabsTrigger value="profile"><UserCircle className="mr-2 h-4 w-4 inline-block" />Profile</TabsTrigger>
            <TabsTrigger value="preferences"><SlidersHorizontal className="mr-2 h-4 w-4 inline-block" />Preferences</TabsTrigger>
            <TabsTrigger value="notifications"><Bell className="mr-2 h-4 w-4 inline-block" />Notifications</TabsTrigger>
            <TabsTrigger value="data"><FileSpreadsheet className="mr-2 h-4 w-4 inline-block"/>Data Mgt.</TabsTrigger> {/* New Data Management Tab */}
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
                        <AvatarImage src={avatarPreview || undefined} alt={currentUser?.displayName || "User Avatar"} />
                        <AvatarFallback><CurrentUserAvatarFallback/></AvatarFallback>
                        </Avatar>
                        <Button variant="outline" type="button" onClick={() => document.getElementById('avatar-upload')?.click()} disabled={isGuest}>
                            <Camera className="mr-2 h-4 w-4" />Change Avatar
                        </Button>
                        <Input id="avatar-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleAvatarChange} disabled={isGuest} />
                    </div>
                    <FormField
                        control={profileForm.control}
                        name="name"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                            <Input placeholder="Your Name" {...field} disabled={isGuest || profileForm.formState.isSubmitting} />
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
                    <Button type="submit" disabled={isGuest || profileForm.formState.isSubmitting}>
                        {profileForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Save Profile
                    </Button>
                    </form>
                </Form>
                </CardContent>
            </Card>
            </TabsContent>

            <TabsContent value="preferences">
            {/* Preferences form content remains largely the same, just ensure disabled states are respected */}
            <Card className="shadow-md">
                <CardHeader>
                <CardTitle>App Preferences</CardTitle>
                <CardDescription>Customize your WakeSync experience.</CardDescription>
                </CardHeader>
                <CardContent>
                {(isLoadingAppContext || preferencesForm.formState.isSubmitting) && !settingsError && ( 
                    <div className="flex items-center justify-center p-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /><span className="ml-2">Loading/Saving preferences...</span></div>
                )}
                {settingsError && !isGuest && ( 
                    <div className="text-destructive p-4 border border-destructive bg-destructive/10 rounded-md">{settingsError}</div>
                )}
                 {isGuest && settingsError && ( 
                    <div className="text-muted-foreground p-4 border border-border bg-muted/50 rounded-md">{settingsError}</div>
                )}
                {!isLoadingAppContext && (!settingsError || isGuest) && ( 
                <Form {...preferencesForm}>
                    <form onSubmit={preferencesForm.handleSubmit(onPreferencesSubmit)} className="space-y-6">
                    <FormField
                        control={preferencesForm.control}
                        name="theme"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Theme</FormLabel>
                             <Select onValueChange={field.onChange} value={field.value} disabled={isGuest || preferencesForm.formState.isSubmitting}>
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
                            <Select onValueChange={field.onChange} value={field.value} disabled={isGuest || preferencesForm.formState.isSubmitting}>
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
                    <Button type="submit" disabled={isGuest || preferencesForm.formState.isSubmitting}>
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
            {/* Notifications form content remains largely the same, ensure disabled states */}
            <Card className="shadow-md">
                <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Manage how you receive alerts and updates.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                {(isLoadingAppContext || preferencesForm.formState.isSubmitting) && !settingsError && (
                     <div className="flex items-center justify-center p-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /><span className="ml-2">Loading/Saving notification settings...</span></div>
                )}
                {settingsError && !isGuest && (
                    <div className="text-destructive p-4 border border-destructive bg-destructive/10 rounded-md">{settingsError}</div>
                )}
                {isGuest && settingsError && (
                    <div className="text-muted-foreground p-4 border border-border bg-muted/50 rounded-md">{settingsError}</div>
                )}
                {!isLoadingAppContext && (!settingsError || isGuest) && (
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
                                        disabled={isGuest || preferencesForm.formState.isSubmitting}
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
                                        disabled={isGuest || preferencesForm.formState.isSubmitting}
                                    />
                                    </FormControl>
                                </FormItem>
                                )}
                            />
                            <Button type="submit" disabled={isGuest || preferencesForm.formState.isSubmitting}>
                                {preferencesForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                Save Notification Settings
                            </Button>
                        </form>
                    </Form>
                )}
                </CardContent>
            </Card>
            </TabsContent>

            <TabsContent value="data">
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Data Management</CardTitle>
                  <CardDescription>Manage your application data. Upload CSV to seed or download current data.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-md font-medium mb-2">Upload Device Data (CSV)</h3>
                    <div className="flex items-center gap-2">
                      <Input type="file" accept=".csv" onChange={handleCsvFileChange} ref={csvFileInputRef} className="flex-grow" disabled={isGuest || isUploadingCsv}/>
                      <Button onClick={handleUploadCsv} disabled={isGuest || !selectedCsvFile || isUploadingCsv}>
                        {isUploadingCsv ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                        Upload
                      </Button>
                    </div>
                    {selectedCsvFile && <p className="text-xs text-muted-foreground mt-1">Selected: {selectedCsvFile.name}</p>}
                    <p className="text-xs text-muted-foreground mt-2">
                        Expected CSV columns for devices: id, userId, name, type, status, room, connectionDetails, dataAiHint, settings_brightness, settings_temperature, settings_volume, createdAt, updatedAt.
                        Uploading will overwrite existing device data if IDs match or add new ones.
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="text-md font-medium mb-2">Download Data (CSV)</h3>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={() => handleDownloadCsv('devices')} disabled={isGuest}>
                            <Download className="mr-2 h-4 w-4" /> Download Devices CSV
                        </Button>
                        {/* Add buttons for other data types like routines when implemented */}
                        {/* <Button variant="outline" onClick={() => handleDownloadCsv('routines')} disabled={isGuest}>
                            <Download className="mr-2 h-4 w-4" /> Download Routines CSV
                        </Button> */}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>


            <TabsContent value="integrations">
            {/* Integrations content remains largely the same, ensure disabled states */}
            <Card className="shadow-md">
                <CardHeader>
                <CardTitle>Connected Accounts & Integrations</CardTitle>
                <CardDescription>Link WakeSync with other services for an enhanced experience. {isGuest && "(Disabled)"}</CardDescription>
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
                    <Button variant="outline" onClick={() => toast({title: "Connect Google Fit (Demo)", description:"Integration flow would start here."})} disabled={isGuest}>Connect</Button>
                    </div>
                </Card>
                {/* ... other integration cards ... */}
                 <Card className="p-4 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <BarChart className="h-8 w-8 text-gray-500" />
                            <div>
                            <h4 className="font-medium">Apple Health</h4>
                            <p className="text-xs text-muted-foreground">Import health data from your Apple devices.</p>
                            </div>
                        </div>
                        <Button variant="outline" onClick={() => toast({title: "Connect Apple Health (Demo)", description:"Integration flow would start here."})} disabled={isGuest}>Connect</Button>
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
                        <Button variant="outline" onClick={() => toast({title: "Connect Spotify (Demo)", description:"Integration flow would start here."})} disabled={isGuest}>Connect</Button>
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
                        <Button variant="outline" onClick={() => toast({title: "Connect Google Calendar (Demo)", description:"Integration flow would start here."})} disabled={isGuest}>Connect</Button>
                    </div>
                </Card>
                </CardContent>
            </Card>
            </TabsContent>

            <TabsContent value="security">
            {/* Security content remains largely the same, ensure disabled states */}
            <Card className="shadow-md">
                <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage your account security. {isGuest && "(Disabled)"}</CardDescription>
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
                                <FormControl><Input type="password" {...field} placeholder="Enter your current password" disabled={isGuest || passwordForm.formState.isSubmitting} /></FormControl>
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
                                <FormControl><Input type="password" {...field} placeholder="Enter new password (min. 8 characters)" disabled={isGuest || passwordForm.formState.isSubmitting} /></FormControl>
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
                                <FormControl><Input type="password" {...field} placeholder="Confirm your new password" disabled={isGuest || passwordForm.formState.isSubmitting} /></FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={isGuest || passwordForm.formState.isSubmitting}>
                            {passwordForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Change Password
                        </Button>
                    </form>
                </Form>
                <div className="mt-8 border-t pt-6">
                    <h3 className="text-lg font-medium">Two-Factor Authentication (2FA)</h3>
                    <p className="text-sm text-muted-foreground mb-3">Add an extra layer of security to your account.</p>
                    <Button variant="outline" onClick={() => toast({title: "Enable 2FA (Demo)", description:"2FA setup flow would start here."})} disabled={isGuest}>Enable 2FA</Button>
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
                            <Button variant="link" size="sm" className="text-destructive hover:text-destructive/80" onClick={() => toast({title:"Session Terminated (Demo)"})} disabled={isGuest}>Log out</Button>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">WakeSync iOS App</p>
                                <p className="text-xs text-muted-foreground">Last active: 2 days ago &bull; IP: 98.76.54.32</p>
                            </div>
                            <Button variant="link" size="sm" className="text-destructive hover:text-destructive/80" onClick={() => toast({title:"Session Terminated (Demo)"})} disabled={isGuest}>Log out</Button>
                        </div>
                    </Card>
                    <Button variant="outline" className="mt-3" onClick={() => toast({title:"Logged out all other sessions (Demo)"})} disabled={isGuest}>Log Out All Other Sessions</Button>
                </div>
                </CardContent>
            </Card>
            </TabsContent>
            
            <TabsContent value="billing">
            {/* Billing content remains largely the same, ensure disabled states */}
            <Card className="shadow-md">
                <CardHeader>
                <CardTitle>Billing & Subscription</CardTitle>
                <CardDescription>Manage your WakeSync subscription and payment methods. {isGuest && "(Demo View - No real billing)"}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <h3 className="text-md font-medium">Current Plan: <span className="text-primary">{isGuest ? "Free Demo" : "Pro Monthly"}</span></h3>
                        <p className="text-sm text-muted-foreground">{isGuest ? "Explore all features with our demo." : "Renews on August 28, 2024. $9.99/month."}</p>
                        <div className="flex gap-2 mt-2">
                            <Button variant="outline" onClick={() => toast({title: "Change Plan (Demo)", description:"Plan selection would be shown here."})} disabled={isGuest}>Change Plan</Button>
                            <Button variant="link" className="text-destructive hover:text-destructive/80" onClick={() => toast({title: "Cancel Subscription (Demo)", description:"Subscription cancellation flow."})} disabled={isGuest}>Cancel Subscription</Button>
                        </div>
                    </div>
                    <div className="border-t pt-6">
                        <h3 className="text-md font-medium">Payment Method</h3>
                        <div className="flex items-center gap-3 mt-2 p-3 border rounded-md bg-secondary/50">
                            <CreditCard className="h-6 w-6 text-muted-foreground"/>
                            <div>
                                <span className="font-medium">{isGuest ? "N/A (Demo Mode)" : "Visa ending in **** 1234"}</span>
                                <p className="text-xs text-muted-foreground">{isGuest ? "No payment method required for demo." : "Expires 12/2026"}</p>
                            </div>
                            <Button variant="ghost" size="sm" className="ml-auto hover:bg-muted" onClick={() => toast({title: "Edit Payment (Demo)", description:"Payment method update form."})} disabled={isGuest}>Edit</Button>
                        </div>
                        <Button variant="outline" className="mt-2" onClick={() => toast({title: "Add Payment Method (Demo)", description:"Form to add new payment method."})} disabled={isGuest}>Add New Payment Method</Button>
                    </div>
                    <div className="border-t pt-6">
                        <h3 className="text-md font-medium">Billing History</h3>
                        <p className="text-sm text-muted-foreground">{isGuest ? "No billing history in demo mode." : "No invoices yet. Your first invoice will appear here after your first billing cycle."}</p>
                         <Button variant="link" size="sm" className="mt-1 px-0" onClick={() => toast({title:"View All Invoices (Demo)"})} disabled={isGuest}>View All Invoices</Button>
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
                        <Button variant="destructive" disabled={!currentUser || isGuest}><Trash2 className="mr-2 h-4 w-4"/>Delete Account</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your account
                            and remove all your data from our servers (locally stored data for this demo).
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
      {!currentUser && !isLoadingAppContext && (
         <Card className="shadow-md">
            <CardHeader>
                <CardTitle>Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Please <Link href="/auth/login" className="text-primary hover:underline">login</Link> or <Link href="/auth/signup" className="text-primary hover:underline">sign up</Link> to manage your settings.</p>
            </CardContent>
         </Card>
      )}
    </div>
  );
}
