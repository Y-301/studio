
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  SidebarSeparator, // Corrected: Import directly from sidebar if it exports it, or from ui/separator
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
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = React.useState(true);
  const [pageTitle, setPageTitle] = React.useState('Dashboard');

  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser(user as User);
      } else {
        setCurrentUser(null);
        const isProtectedDashboardPage = pathname.startsWith('/dashboard/') && pathname !== '/dashboard';

        if (isProtectedDashboardPage && process.env.NEXT_PUBLIC_USE_MOCK_MODE !== 'true') {
             console.log("User not authenticated for protected page, redirecting to login for:", pathname);
             router.push('/auth/login');
        } else if (isProtectedDashboardPage && process.env.NEXT_PUBLIC_USE_MOCK_MODE === 'true'){
            console.log("Mock mode: User not authenticated for protected page, but allowing access to", pathname, "for demo purposes.");
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
      await auth.signOut(auth);
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      setCurrentUser(null); 
      router.push('/auth/login');
    } catch (error) {
      console.error("Logout error:", error);
      toast({ title: "Logout Failed", description: (error as Error).message || "Could not log out. Please try again.", variant: "destructive" });
    }
  };
  
  const isGuestAccessAllowed = process.env.NEXT_PUBLIC_USE_MOCK_MODE === 'true' || pathname === '/dashboard';
  const shouldShowLoader = loadingAuth && !currentUser && !isGuestAccessAllowed;


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
