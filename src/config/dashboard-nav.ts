import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, Smartphone, ListChecks, Waypoints, Watch, BarChart3, FileText, SettingsIcon, Bot } from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  label?: string;
  disabled?: boolean;
  external?: boolean;
}

export const dashboardNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Devices',
    href: '/dashboard/devices',
    icon: Smartphone,
  },
  {
    title: 'Routines',
    href: '/dashboard/routines',
    icon: ListChecks,
  },
  {
    title: 'Simulation',
    href: '/dashboard/simulation',
    icon: Waypoints,
  },
  {
    title: 'Wristband',
    href: '/dashboard/wristband',
    icon: Watch,
  },
  {
    title: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
  },
  {
    title: 'Logs',
    href: '/dashboard/logs',
    icon: FileText,
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: SettingsIcon,
  },
];
