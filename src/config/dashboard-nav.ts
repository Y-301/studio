import type { LucideIcon } from 'lucide-react';
import { 
  LayoutDashboard, 
  Smartphone, 
  ListChecks, 
  Waypoints, 
  Watch, 
  BarChart3, 
  FileText, 
  SettingsIcon,
  Database,
  Workflow,
  BrainCircuit,
  ClipboardCheck
} from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  label?: string; // This can be used for badges or additional info if needed
  disabled?: boolean;
  external?: boolean;
}

export interface NavItemGroup {
  title?: string; // Optional title for the group
  items: NavItem[];
}

export const dashboardNavItems: NavItemGroup[] = [
  {
    // First group for existing items, no explicit title or a generic one like "Workspace"
    // title: "Workspace", 
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
