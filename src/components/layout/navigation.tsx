import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  FileText,
  Gauge,
  Lightbulb,
  UsersRound,
  Settings,
  User,
  Bell,
  Plug,
} from 'lucide-react';

export type AppNavItem = {
  name: string;
  shortName: string;
  icon: LucideIcon;
  route: string;
};

export const primaryNavItems: AppNavItem[] = [
  { name: 'Overview', shortName: 'Overview', icon: Gauge, route: '/dashboard' },
  { name: 'Campaigns', shortName: 'Campaigns', icon: BarChart3, route: '/campaigns' },
  { name: 'Leads', shortName: 'Leads', icon: UsersRound, route: '/leads' },
  { name: 'Insights', shortName: 'Insights', icon: Lightbulb, route: '/insights' },
  { name: 'Reports', shortName: 'Reports', icon: FileText, route: '/reports' },
  { name: 'Calendar', shortName: 'Calendar', icon: CalendarDays, route: '/calendar' },
  { name: 'Approvals', shortName: 'Approvals', icon: CheckCircle2, route: '/notifications' },
  { name: 'Integrations', shortName: 'Connect', icon: Plug, route: '/integration' },
];

export const secondaryNavItems: AppNavItem[] = [
  { name: 'Settings', shortName: 'Settings', icon: Settings, route: '/settings' },
  { name: 'Profile', shortName: 'Profile', icon: User, route: '/settings/profile' },
  { name: 'Notifications', shortName: 'Alerts', icon: Bell, route: '/notifications' },
];

export const mobileBottomNavItems: AppNavItem[] = [
  { name: 'Overview', shortName: 'Overview', icon: Gauge, route: '/dashboard' },
  { name: 'Campaigns', shortName: 'Campaigns', icon: BarChart3, route: '/campaigns' },
  { name: 'Leads', shortName: 'Leads', icon: UsersRound, route: '/leads' },
  { name: 'Insights', shortName: 'Insights', icon: Lightbulb, route: '/insights' },
  { name: 'Reports', shortName: 'Reports', icon: FileText, route: '/reports' },
  { name: 'Integrations', shortName: 'Connect', icon: Plug, route: '/integration' },
];

export function isAppNavItemActive(pathname: string | null, route: string): boolean {
  if (!pathname) return false;
  if (route === '/dashboard') return pathname === '/' || pathname === '/dashboard';
  return pathname === route || pathname.startsWith(`${route}/`);
}
