
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
import { Bell, LogOut, UserCircle, CreditCard, Settings as SettingsIconLucide, Link as LinkIconLucideComponent, Loader2, LogIn, Settings, AlertTriangle } from 'lucide-react';
import { Logo } from '@/components/shared/Logo';
import { dashboardNavItems, type NavItem } from '@/config/dashboard-nav';
import { cn } from '@/lib/utils';
import { Footer } from '@/components/layout/Footer';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { AppProvider, useAppContext } from '@/contexts/AppContext'; // Import AppProvider and useAppContext
import { auth, User } from '@/lib/firebase'; // Import auth and User for local auth


function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { isAppInitialized, isLoadingStatus, isDataFromCsv, currentUser } = useAppContext();
  const [pageTitle, setPageTitle] = React.useState('Dashboard');

  React.useEffect(() => {
    if (!isLoadingStatus && !isAppInitialized && pathname !== '/auth/signup' && pathname !=='/auth/login') {
      // If app is not initialized (no users) and not already on signup/login, redirect to signup.
      // This ensures new users are prompted to create an account first.
      console.log("App not initialized and no current user, redirecting to signup.");
      router.push('/auth/signup');
    } else if (!isLoadingStatus && isAppInitialized && !currentUser && !pathname.startsWith('/auth/')) {
      // App is initialized (users exist), but current user is not logged in. Redirect to login.
      console.log("App initialized, but no current user, redirecting to login for path:", pathname);
      router.push('/auth/login');
    }
  }, [isAppInitialized, isLoadingStatus, currentUser, router, pathname]);


  React.useEffect(() => {
    const currentNavItem = dashboardNavItems
      .flatMap(group => group.items)
      .find(item => pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/dashboard' && !item.href.includes('#')));
    if (currentNavItem) {
      setPageTitle(currentNavItem.title);
    } else if (pathname === '/dashboard') {
      setPageTitle('Dashboard Overview');
    } else if (pathname.startsWith('/dashboard/settings')) { // Match base and sub-paths like /dashboard/settings/profile
      setPageTitle('Settings');
    }
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await auth.signOut(auth); // Uses local signOut
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push('/auth/login');
    } catch (error) {
      console.error("Logout error:", error);
      toast({ title: "Logout Failed", description: (error as Error).message || "Could not log out. Please try again.", variant: "destructive" });
    }
  };

  if (isLoadingStatus || (!currentUser && isAppInitialized && !pathname.startsWith('/auth/'))) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">{isLoadingStatus ? "Checking app status..." : "Authenticating..."}</p>
      </div>
    );
  }
  
  // If app is not initialized and not on auth pages, show setup prompt or redirect handled above
  if (!isLoadingStatus && !isAppInitialized && !pathname.startsWith('/auth/')) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
          <Logo className="mb-8" iconSize={48} textSize="text-4xl"/>
          <h1 className="text-2xl font-semibold mb-4">Welcome to WakeSync!</h1>
          <p className="text-muted-foreground mb-6 text-center">
            It looks like this is your first time here or there are no users yet.
          </p>
          <Button asChild size="lg">
            <Link href="/auth/signup">Create Your First Account</Link>
          </Button>
           <p className="text-sm text-muted-foreground mt-4">
            Alternatively, if you have a data file, you can set up via settings after creating an account.
          </p>
        </div>
      );
  }


  const isNavItemDisabled = (item: NavItem) => {
    // In full local mode, most items should be enabled if a user is logged in.
    // Specific items might still have a 'disabled' flag in their config.
    return !currentUser || item.disabled;
  };


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
                      <Link href={item.href} legacyBehavior={item.href.includes('#') ? undefined : true} passHref={item.href.includes('#') ? undefined : true}>
                        <SidebarMenuButton
                          isActive={pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/dashboard') || (item.href.includes('#') && pathname === item.href.split('#')[0])}
                          tooltip={{content: item.title, side: 'right', align: 'center', className: "ml-2"}}
                          disabled={isNavItemDisabled(item)}
                          className={cn(
                            "w-full justify-start",
                            isNavItemDisabled(item) && "cursor-not-allowed opacity-50"
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
                  disabled={!currentUser}
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
          {isDataFromCsv && (
            <div className="flex items-center gap-1.5 px-2 py-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-md shadow">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>CSV Data Active</span>
            </div>
          )}
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
                <DropdownMenuLabel>{currentUser ? (currentUser.displayName || currentUser.email || "My Account") : "Guest"}</DropdownMenuLabel>
                <DropdownMenuSeparatorComponent />
                {currentUser ? (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/settings" className="flex items-center w-full">
                        <>
                          <SettingsIconLucide className="mr-2 h-4 w-4" />
                          Profile & Settings
                        </>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/settings#billing" className="flex items-center w-full">
                        <>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Billing
                        </>
                      </Link>
                    </DropdownMenuItem>
                     <DropdownMenuItem asChild>
                      <Link href="/dashboard/settings#integrations" className="flex items-center w-full">
                        <>
                          <LinkIconLucideComponent className="mr-2 h-4 w-4" />
                          Integrations
                        </>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparatorComponent />
                    <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                    >
                        <>
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                        </>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/auth/login" className="flex items-center w-full">
                        <>
                          <LogIn className="mr-2 h-4 w-4" />
                          Login
                        </>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/auth/signup" className="flex items-center w-full">
                        <>
                          <UserCircle className="mr-2 h-4 w-4" />
                          Sign Up
                        </>
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

// Wrap DashboardLayoutContent with AppProvider
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </AppProvider>
  );
}
