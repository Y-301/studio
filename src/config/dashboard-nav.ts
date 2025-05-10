import type { LucideIcon } from 'lucide-react';
import { 
  LayoutDashboard, 
  Smartphone, 
  ListChecks, 
  Waypoints, // For Simulation
  Watch, 
  BarChart3, 
  FileText, 
  SettingsIcon,
  Database,
  Workflow,
  BrainCircuit,
  ClipboardCheck,
  Link as LinkIcon // Added for Integrations
} from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  label?: string; 
  disabled?: boolean;
  external?: boolean;
}

export interface NavItemGroup {
  title?: string; 
  items: NavItem[];
}

export const dashboardNavItems: NavItemGroup[] = [
  {
    items: [
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
        icon: Waypoints, // Using Waypoints as a more generic simulation icon
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
       { // Added for consistency with Settings page tabs
        title: 'Integrations',
        href: '/dashboard/settings#integrations', // Link to the integrations tab in settings
        icon: LinkIcon,
      },
    ],
  },
  {
    title: "Data Science",
    items: [
      {
        title: 'Datasets',
        href: '/dashboard/datascience/datasets',
        icon: Database,
      },
      {
        title: 'Data Studio',
        href: '/dashboard/datascience/datastudio',
        icon: Workflow,
      },
      {
        title: 'Model Training',
        href: '/dashboard/datascience/modeltraining',
        icon: BrainCircuit,
      },
      {
        title: 'Model Evaluation',
        href: '/dashboard/datascience/modelevaluation',
        icon: ClipboardCheck,
      },
    ],
  },
];
