
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
// Use the auth object and User type from the conditional firebase.ts
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
  name: z.string().min(2, { message: "Name must be at least 2 characters." }).optional().or(z.literal('')),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      // auth will be mock or real based on USE_MOCK_MODE
      const userCredential = await auth.createUserWithEmailAndPassword(auth, values.email, values.password);
      if (userCredential.user && values.name) {
        // The user object from createUserWithEmailAndPassword should be compatible with updateProfile
        await auth.updateProfile(userCredential.user as User, { displayName: values.name });
      }
      toast({
        title: `Account Created (${process.env.NEXT_PUBLIC_USE_MOCK_MODE === 'true' ? 'Mock' : 'Real'})`,
        description: "Welcome to WakeSync! Redirecting to your dashboard...",
      });
      router.push("/dashboard");
    } catch (error: any) {
      console.error(`Signup error (${process.env.NEXT_PUBLIC_USE_MOCK_MODE === 'true' ? 'Mock' : 'Real'}):`, error);
      let userMessage = `Could not create account. Please try again. (${process.env.NEXT_PUBLIC_USE_MOCK_MODE === 'true' ? 'Mock' : 'Real'})`;
      if (error.code === 'auth/email-already-in-use' || error.message?.includes("auth/email-already-in-use")) {
        userMessage = `This email address is already in use. (${process.env.NEXT_PUBLIC_USE_MOCK_MODE === 'true' ? 'Mock' : 'Real'})`;
      }
      toast({
        title: `Signup Failed (${process.env.NEXT_PUBLIC_USE_MOCK_MODE === 'true' ? 'Mock' : 'Real'})`,
        description: userMessage,
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
            <CardTitle className="text-2xl font-bold tracking-tight">Create Your Account</CardTitle>
            <CardDescription>
              Join WakeSync and start your journey to better mornings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full mt-6" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Account
                </Button>
              </form>
            </Form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/auth/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}

