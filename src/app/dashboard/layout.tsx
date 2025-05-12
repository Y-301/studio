
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
// Import the general User type and auth from the conditional firebase.ts
import { auth, type User } from '@/lib/firebase'; 
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator as DropdownMenuSeparatorComponent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, LogOut, UserCircle, CreditCard, Settings, Link as LinkIconLucide, Loader2, LogIn } from 'lucide-react'; 
import { Logo } from '@/components/shared/Logo';
import { dashboardNavItems, type NavItem } from '@/config/dashboard-nav'; 
import { cn } from '@/lib/utils';
import { Footer } from '@/components/layout/Footer';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/shared/ThemeToggle';


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = React.useState<User | null>(null); // Use the general User type
  const [loadingAuth, setLoadingAuth] = React.useState(true);
  const [pageTitle, setPageTitle] = React.useState('Dashboard');

  React.useEffect(() => {
    // auth will be mock or real based on USE_MOCK_MODE
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser(user as User); // Cast if necessary, though User type should cover both
      } else {
        setCurrentUser(null);
        // For demo with Try Demo Dashboard, we don't strictly redirect if not logged in for dashboard pages.
        // This allows exploring the UI. Protected actions within pages should still check auth status.
        const isAuthRequiredPage = !['/dashboard', '/auth/login', '/auth/signup', '/auth/forgot-password'].includes(pathname) && 
                                   !pathname.startsWith('/features') && !pathname.startsWith('/learn-more') && !pathname.startsWith('/pricing');
        
        if (isAuthRequiredPage && process.env.NEXT_PUBLIC_USE_MOCK_MODE !== 'true') { // Only enforce for real mode or if explicitly desired for mock
             console.log("User not authenticated, redirecting to login for:", pathname);
             router.push('/auth/login');
        } else if (isAuthRequiredPage && process.env.NEXT_PUBLIC_USE_MOCK_MODE === 'true'){
            console.log("Mock mode: User not authenticated, but allowing access to", pathname, "for demo purposes.");
        }
      }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, [pathname, router]);

  React.useEffect(() => {
    const currentNavItem = dashboardNavItems
      .flatMap(group => group.items)
      .find(item => pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/dashboard' && !item.href.includes('#')));
    if (currentNavItem) {
      setPageTitle(currentNavItem.title);
    } else if (pathname === '/dashboard') {
      setPageTitle('Dashboard Overview');
    }
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await auth.signOut(auth); // auth will be mock or real
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      setCurrentUser(null); 
      router.push('/auth/login');
    } catch (error) {
      console.error("Logout error:", error);
      toast({ title: "Logout Failed", description: (error as Error).message || "Could not log out. Please try again.", variant: "destructive" });
    }
  };

  // Show loading state only if not in mock mode or if explicitly checking auth for a protected page
  const shouldShowLoader = loadingAuth && !currentUser && 
                           !['/dashboard'].includes(pathname) && // Allow dashboard to load even if not logged in for demo
                           (process.env.NEXT_PUBLIC_USE_MOCK_MODE !== 'true'); 

  if (shouldShowLoader) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Authenticating...</p>
      </div>
    );
  }
  
  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" className="border-r border-sidebar-border">
        <SidebarHeader className="p-4 border-b border-sidebar-border">
          <Logo />
        </SidebarHeader>
        <SidebarContent className="p-2">
          {dashboardNavItems.map((group, groupIndex) => (
            <SidebarGroup key={group.title || `group-${groupIndex}`} className="p-0 mb-2">
              {group.title && (
                <SidebarGroupLabel className="px-2 text-xs font-semibold text-sidebar-foreground/70 mb-1">
                  {group.title}
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item: NavItem) => (
                    <SidebarMenuItem key={item.href} className="my-0.5">
                      <Link href={item.href} legacyBehavior passHref>
                        <SidebarMenuButton
                          isActive={pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/dashboard') || (item.href.includes('#') && pathname === item.href.split('#')[0])}
                          tooltip={{content: item.title, side: 'right', align: 'center', className: "ml-2"}}
                          // In mock mode, or if current user exists, item is enabled unless explicitly item.disabled
                          disabled={item.disabled && !currentUser && process.env.NEXT_PUBLIC_USE_MOCK_MODE !== 'true'} 
                          className={cn(
                            "w-full justify-start",
                            item.disabled && !currentUser && process.env.NEXT_PUBLIC_USE_MOCK_MODE !== 'true' && "cursor-not-allowed opacity-50"
                          )}
                        >
                          <item.icon className="h-5 w-5 shrink-0" />
                          <span className="truncate">{item.title}</span>
                        </SidebarMenuButton>
                      </Link>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
               {groupIndex < dashboardNavItems.length -1 && <SidebarSeparator className="my-2" />}
            </SidebarGroup>
          ))}
        </SidebarContent>
        <SidebarFooter className="p-2 border-t border-sidebar-border">
           <SidebarMenu>
            <SidebarMenuItem>
               <Link href="/dashboard/settings" legacyBehavior passHref>
                <SidebarMenuButton 
                  isActive={pathname.startsWith('/dashboard/settings')}
                  tooltip={{content: "Settings", side: 'right', align: 'center', className: "ml-2"}}
                  className="w-full justify-start"
                  disabled={!currentUser && process.env.NEXT_PUBLIC_USE_MOCK_MODE !== 'true'}
                >
                  <Settings className="h-5 w-5 shrink-0" />
                  <span className="truncate">Settings</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col min-h-screen bg-secondary/30 dark:bg-background">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 shadow-sm">
          <div className="md:hidden"> 
             <SidebarTrigger />
          </div>
          <div className="flex-1">
             <h1 className="text-xl font-semibold text-foreground">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <ThemeToggle />
            <Button variant="ghost" size="icon" aria-label="Notifications" className="relative rounded-full h-9 w-9">
              <Bell className="h-5 w-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={currentUser?.photoURL || undefined} alt={currentUser?.displayName || "User Avatar"} />
                    <AvatarFallback>
                      {currentUser ? (currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : currentUser.email ? currentUser.email.charAt(0).toUpperCase() : <UserCircle className="h-5 w-5"/>) : <UserCircle className="h-5 w-5"/>}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{currentUser ? (currentUser.displayName || currentUser.email || "My Account") : "Guest Account"}</DropdownMenuLabel>
                <DropdownMenuSeparatorComponent />
                {currentUser ? (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/settings" className="flex items-center w-full">
                        <Settings className="mr-2 h-4 w-4" /> 
                        Profile & Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/settings#billing" className="flex items-center w-full">
                        <CreditCard className="mr-2 h-4 w-4" />
                        Billing
                      </Link>
                    </DropdownMenuItem>
                     <DropdownMenuItem asChild>
                      <Link href="/dashboard/settings#integrations" className="flex items-center w-full">
                        <LinkIconLucide className="mr-2 h-4 w-4" />
                        Integrations
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparatorComponent />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/auth/login" className="flex items-center w-full">
                        <LogIn className="mr-2 h-4 w-4" />
                        Login
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/auth/signup" className="flex items-center w-full">
                        <UserCircle className="mr-2 h-4 w-4" />
                        Sign Up
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <Footer />
      </SidebarInset>
    </SidebarProvider>
  );
}

