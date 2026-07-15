"use client";

import { usePathname, useRouter } from "next/navigation";
import { Avatar, Menu } from "@mantine/core";
import { Bell, ChevronDown, LogOut, Plus, Search, User } from "lucide-react";
import { clientHandleSignOut } from "@/lib/client";
import type { NotificationFeedItem } from "@/lib/shared";
import PlatformAdAccountDropdownClient from "./PlatformAdAccountDropdownClient";
import WorkspaceSwitcherClient from "./WorkspaceSwitcherClient";
import ThemeToggle from "../ThemeToggle";

type TopBarClientProps = {
  userInfo: any;
  businessId: string;
  platforms?: any[];
  adAccounts?: any[];
  notifications?: NotificationFeedItem[];
  initialPlatformId?: string | null;
  initialAccountId?: string | null;
};

const pageTitles: Record<string, string> = {
  dashboard: "Overview",
  campaigns: "Campaigns",
  leads: "Leads",
  insights: "Insights",
  reports: "Reports",
  calendar: "Calendar",
  notifications: "Approvals",
  settings: "Settings",
  integration: "Connected platforms",
};

export default function TopBarClient({
  userInfo,
  businessId,
  platforms = [],
  adAccounts = [],
  notifications = [],
  initialPlatformId,
  initialAccountId,
}: TopBarClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const segment = pathname?.split("/").filter(Boolean)[0] ?? "dashboard";
  const pageTitle = pageTitles[segment] ?? "Workspace";
  const fullName =
    `${userInfo?.first_name ?? ""} ${userInfo?.last_name ?? ""}`.trim() ||
    "User";
  const initials = fullName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const unreadCount = notifications.filter((item) => !item.read).length;

  return (
    <div className="dv-topbar">
      <div className="dv-topbar-left">
        {/* <div>
          <p className="dv-eyebrow">AI Performance Marketing Command Center</p>
          <h1>{pageTitle}</h1>
        </div> */}
        <PlatformAdAccountDropdownClient
          businessId={businessId}
          platforms={platforms}
          adAccounts={adAccounts}
          initialPlatformId={initialPlatformId}
          initialAccountId={initialAccountId}
        />
      </div>

      <div className="dv-topbar-actions">
        <div className="dv-search">
          <Search size={15} strokeWidth={1.6} />
          <span>Search campaigns, leads, reports</span>
        </div>
        <button
          type="button"
          className="dv-outline-button"
          onClick={() => router.push("/campaigns/create")}
        >
          <Plus size={16} strokeWidth={1.6} />
          New campaign
        </button>
        <ThemeToggle />
        <button
          type="button"
          className="dv-icon-button"
          onClick={() => router.push("/notifications")}
          aria-label="Open approvals"
        >
          <Bell size={17} strokeWidth={1.6} />
          {unreadCount > 0 ? (
            <span className="dv-notification-dot">{unreadCount}</span>
          ) : null}
        </button>
        <WorkspaceSwitcherClient />
        <Menu shadow="md" width={220} position="bottom-end">
          <Menu.Target>
            <button type="button" className="dv-user-button">
              <Avatar size={32} radius="xl" color="orange">
                {initials}
              </Avatar>
              <span>{fullName}</span>
              <ChevronDown size={15} strokeWidth={1.6} />
            </button>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Label>Account</Menu.Label>
            <Menu.Item
              leftSection={<User size={15} />}
              onClick={() => router.push("/settings/profile")}
            >
              Profile
            </Menu.Item>
            <Menu.Item
              leftSection={<LogOut size={15} />}
              color="red"
              onClick={clientHandleSignOut}
            >
              Logout
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </div>
    </div>
  );
}
