'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Settings } from 'lucide-react';
import { clientHandleSignOut } from '@/lib/client';
import { isAppNavItemActive, primaryNavItems } from './navigation';

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="dv-sidebar">
      <div className="dv-sidebar-brand">
        <span className="dv-logo-mark">D</span>
        <span className="dv-brand-text">DeepVisor</span>
      </div>

      <nav className="dv-sidebar-nav" aria-label="Primary navigation">
        {primaryNavItems.map((item) => {
          const active = isAppNavItemActive(pathname, item.route);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.route}
              className={`dv-nav-item ${active ? 'is-active' : ''}`}
              title={item.name}
            >
              <Icon size={18} strokeWidth={1.6} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="dv-sidebar-footer">
        <Link href="/settings" className={`dv-nav-item ${isAppNavItemActive(pathname, '/settings') ? 'is-active' : ''}`}>
          <Settings size={18} strokeWidth={1.6} />
          <span>Settings</span>
        </Link>
        <button type="button" className="dv-nav-item dv-nav-button" onClick={clientHandleSignOut}>
          <LogOut size={18} strokeWidth={1.6} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
