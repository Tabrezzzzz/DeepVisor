'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { Badge, Group, Menu, Text, ThemeIcon } from '@mantine/core';
import { Building2, Check, ChevronDown, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Workspace = {
  organizationId: string;
  organizationName: string;
  organizationType: string;
  businessName: string;
  role: string;
  selected: boolean;
};

export default function WorkspaceSwitcherClient() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadWorkspaces() {
      const response = await fetch('/api/workspaces');
      if (!response.ok) return;
      const payload = await response.json();
      if (!cancelled) setWorkspaces(payload.workspaces ?? []);
    }

    void loadWorkspaces();
    return () => {
      cancelled = true;
    };
  }, []);

  const reloadWorkspaces = async () => {
    const response = await fetch('/api/workspaces');
    if (!response.ok) return;
    const payload = await response.json();
    setWorkspaces(payload.workspaces ?? []);
  };

  const selected = useMemo(
    () => workspaces.find((workspace) => workspace.selected) ?? workspaces[0] ?? null,
    [workspaces]
  );

  const switchWorkspace = (organizationId: string) => {
    startTransition(async () => {
      const response = await fetch('/api/workspaces/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId }),
      });
      if (response.ok) {
        await reloadWorkspaces();
        router.refresh();
      }
    });
  };

  const createWorkspace = () => {
    router.push('/workspace/new');
  };

  if (!selected) {
    return null;
  }

  return (
    <Menu shadow="md" width={340} position="bottom-start">
      <Menu.Target>
        <button type="button" className="dv-outline-button" disabled={isPending}>
          <Building2 size={16} strokeWidth={1.6} />
          <span>{selected.businessName || selected.organizationName}</span>
          <ChevronDown size={14} strokeWidth={1.6} />
        </button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>Workspaces</Menu.Label>
        {workspaces.map((workspace) => {
          const active = workspace.organizationId === selected.organizationId;
          return (
            <Menu.Item
              key={workspace.organizationId}
              onClick={() => switchWorkspace(workspace.organizationId)}
              disabled={active || isPending}
            >
              <Group justify="space-between" wrap="nowrap">
                <Group gap="sm" wrap="nowrap">
                  <ThemeIcon size="lg" radius="xl" variant="light" color={active ? 'orange' : 'gray'}>
                    <Building2 size={16} />
                  </ThemeIcon>
                  <div>
                    <Text size="sm" fw={700} lineClamp={1}>{workspace.businessName || workspace.organizationName}</Text>
                    <Group gap={6}>
                      <Text size="xs" c="dimmed">{workspace.organizationType}</Text>
                      <Badge size="xs" variant="light" color="gray">{workspace.role}</Badge>
                    </Group>
                  </div>
                </Group>
                {active ? <Check size={16} /> : null}
              </Group>
            </Menu.Item>
          );
        })}
        <Menu.Divider />
        <Menu.Item leftSection={<Plus size={15} />} onClick={createWorkspace}>
          Create workspace
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
