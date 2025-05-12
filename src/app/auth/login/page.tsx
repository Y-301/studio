
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
// Use the auth object from the conditional firebase.ts
import { auth, type User } from "@/lib/firebase"; 
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { Footer } from "@/components/layout/Footer";
import { Logo } from "@/components/shared/Logo";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import React from "react";

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      // auth will be mock or real based on USE_MOCK_MODE
      // The second argument to signInWithEmailAndPassword (the auth instance) is often implicitly handled
      // by the Firebase SDK if 'auth' is the initialized Auth instance.
      // For the mock, auth.signInWithEmailAndPassword(auth, ...) is how it was defined.
      // For real Firebase, it's usually signInWithEmailAndPassword(getAuth(), email, password).
      // The firebase.ts now exports specific methods if needed or a pre-configured auth object.
      await auth.signInWithEmailAndPassword(auth, values.email, values.password); 
      
      toast({
        title: `Login Successful (${process.env.NEXT_PUBLIC_USE_MOCK_MODE === 'true' ? 'Mock' : 'Real'})`,
        description: "Redirecting to your dashboard...",
      });
      router.push("/dashboard");
    } catch (error: any) {
      console.error(`Login error (${process.env.NEXT_PUBLIC_USE_MOCK_MODE === 'true' ? 'Mock' : 'Real'}):`, error);
      let errorMessage = error.message || "Could not sign in. Please check your credentials and try again.";
      
      // Check for specific error codes (Firebase or mock)
      if (error.code === 'auth/api-key-not-valid' || errorMessage.includes('auth/api-key-not-valid')) {
        errorMessage = `Application configuration error: API key is not valid. Please contact support or check the environment setup. (${process.env.NEXT_PUBLIC_USE_MOCK_MODE === 'true' ? 'Mock mode active' : 'Real Firebase mode'}).`;
         console.error("CRITICAL: Firebase API Key is not valid. Ensure NEXT_PUBLIC_FIREBASE_API_KEY in your .env file is correct and the Firebase project is properly configured for this domain.");
      } else if (error.code === 'auth/invalid-credential' || error.message?.includes('auth/invalid-credential') || 
                 error.code === 'auth/user-not-found' || error.message?.includes('auth/user-not-found') || 
                 error.code === 'auth/wrong-password' || error.message?.includes('auth/wrong-password')) {
        errorMessage = `Invalid email or password. Please try again. (${process.env.NEXT_PUBLIC_USE_MOCK_MODE === 'true' ? 'Mock' : 'Real'})`;
      } else if (error.code === 'auth/too-many-requests' || error.message?.includes('auth/too-many-requests')) {
        errorMessage = `Too many failed login attempts. Please try again later. (${process.env.NEXT_PUBLIC_USE_MOCK_MODE === 'true' ? 'Mock' : 'Real'})`;
      }
      
      toast({
        title: `Login Failed (${process.env.NEXT_PUBLIC_USE_MOCK_MODE === 'true' ? 'Mock' : 'Real'})`,
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <PublicHeader />
      <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-secondary/30">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <Logo className="justify-center mb-4" iconSize={32} textSize="text-3xl" />
            <CardTitle className="text-2xl font-bold tracking-tight">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to access your WakeSync dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@example.com" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <Link href="/auth/forgot-password" className="font-medium text-primary hover:underline">
                      Forgot your password?
                    </Link>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
              </form>
            </Form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/auth/signup" className="font-medium text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}

