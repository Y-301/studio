import type { LucideIcon } from 'lucide-react';
import { 
  LayoutDashboard, 
  Smartphone, 
  ListChecks, 
  Waypoints, // For Simulation
  Watch, 
  BarChart3, 
  FileText, 
  Settings as SettingsIcon, // Renamed to avoid conflict
  Database,
  Workflow,
  BrainCircuit,
  ClipboardCheck,
  Link as LinkIconLucide // Renamed to avoid conflict
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

// When NEXT_PUBLIC_USE_MOCK_MODE is true, we generally want all nav items to be enabled
// for demonstration purposes, even if a "user" isn't technically logged into a real backend.
// The auth state in mock mode might be null if no mock user is "logged in".
const isMockMode = process.env.NEXT_PUBLIC_USE_MOCK_MODE === 'true';

export const dashboardNavItems: NavItemGroup[] = [
  {
    items: [
      {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        disabled: false, // Dashboard should always be accessible
      },
      {
        title: 'Devices',
        href: '/dashboard/devices',
        icon: Smartphone,
        disabled: isMockMode ? false : undefined, // Enabled in mock, auth-dependent otherwise
      },
      {
        title: 'Routines',
        href: '/dashboard/routines',
        icon: ListChecks,
        disabled: isMockMode ? false : undefined, 
      },
      {
        title: 'Simulation',
        href: '/dashboard/simulation',
        icon: Waypoints, 
        disabled: false, // Simulation page might be fine for guests in mock
      },
      {
        title: 'Wristband',
        href: '/dashboard/wristband',
        icon: Watch,
        disabled: isMockMode ? false : undefined, 
      },
      {
        title: 'Analytics',
        href: '/dashboard/analytics',
        icon: BarChart3,
        disabled: false, // Analytics can show mock data
      },
      {
        title: 'Logs',
        href: '/dashboard/logs',
        icon: FileText,
        disabled: isMockMode ? false : undefined, 
      },
      {
        title: 'Settings',
        href: '/dashboard/settings', // Changed from /auth/settings to /dashboard/settings
        icon: SettingsIcon,
        disabled: isMockMode ? false : undefined, 
      },
       { 
        title: 'Integrations',
        href: '/dashboard/settings#integrations', // Points to a section within settings
        icon: LinkIconLucide,
        disabled: isMockMode ? false : undefined, 
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
        disabled: false, // Allow access in mock for demo
      },
      {
        title: 'Data Studio',
        href: '/dashboard/datascience/datastudio',
        icon: Workflow,
        disabled: false,
      },
      {
        title: 'Model Training',
        href: '/dashboard/datascience/modeltraining',
        icon: BrainCircuit,
        disabled: false,
      },
      {
        title: 'Model Evaluation',
        href: '/dashboard/datascience/modelevaluation',
        icon: ClipboardCheck,
        disabled: false,
      },
    ],
  },
];
