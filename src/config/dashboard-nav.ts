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
  disabled?: boolean; // Can be used to disable for guests
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
        disabled: false, 
      },
      {
        title: 'Routines',
        href: '/dashboard/routines',
        icon: ListChecks,
        disabled: false, 
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
        disabled: false, 
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
        disabled: false, 
      },
      {
        title: 'Settings',
        href: '/dashboard/settings',
        icon: SettingsIcon,
        disabled: false, 
      },
       { 
        title: 'Integrations',
        href: '/dashboard/settings#integrations',
        icon: LinkIcon,
        disabled: false, 
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
