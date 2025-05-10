'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, LogOut, Moon, Sun, UserCircle, CreditCard, Settings, Link as LinkIcon } from 'lucide-react'; 
import { Logo } from '@/components/shared/Logo';
import { dashboardNavItems, type NavItemGroup } from '@/config/dashboard-nav'; 
import { cn } from '@/lib/utils';
import { Footer } from '@/components/layout/Footer'; // Import Footer

// A simple theme toggle - for demonstration. 
// In a real app, this would use context and persist theme.
function ThemeToggle() {
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);


  React.useEffect(() => {
    setMounted(true);
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else if (prefersDark) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newIsDarkMode = !isDarkMode;
    setIsDarkMode(newIsDarkMode);
    if (newIsDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };
  
  if (!mounted) return <Button variant="ghost" size="icon" disabled className="h-5 w-5"></Button>;


  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
      {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <Logo />
        </SidebarHeader>
        <SidebarContent>
          {dashboardNavItems.map((group, groupIndex) => (
            <SidebarGroup key={group.title || `group-${groupIndex}`}>
              {group.title && (
                <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <Link href={item.href} legacyBehavior passHref>
                        <SidebarMenuButton
                          isActive={pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard' && !item.href.includes('#')) || (item.href.includes('#') && pathname === item.href.split('#')[0])}
                          tooltip={item.title}
                        >
                          <item.icon />
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                      </Link>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
        <SidebarFooter>
          {/* Placeholder for any footer items in sidebar */}
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col min-h-screen"> {/* Ensure SidebarInset takes full height and is flex col */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
          <div className="md:hidden"> 
             <SidebarTrigger />
          </div>
          <div className="flex-1">
            {/* Optional: Breadcrumbs or page title */}
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-5 w-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="https://picsum.photos/seed/user-avatar/100/100" alt="User Avatar" data-ai-hint="person avatar" />
                    <AvatarFallback>
                      <UserCircle />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
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
                    <LinkIcon className="mr-2 h-4 w-4" />
                    Integrations
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    // TODO: Implement logout
                    if (typeof window !== 'undefined') window.location.href = '/auth/login';
                  }}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-700/20"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
        <Footer /> {/* Add Footer here to make it sticky within the main content area */}
      </SidebarInset>
    </SidebarProvider>
  );
}
