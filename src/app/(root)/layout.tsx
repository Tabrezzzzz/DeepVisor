import Topbar from '@/components/layout/topBar/TopBar';
import Sidebar from '@/components/layout/LeftSidebar';
import { getRequiredAppContext } from '@/lib/server/actions/app/context';
import { resolveCurrentSelection } from '@/lib/server/actions/app/selection';
import { getPlatformDetails } from '@/lib/server/data';

function resolvePlatformTheme(value: string | null | undefined): 'default' | 'meta' | 'google' | 'tiktok' {
  switch (value) {
    case 'meta':
    case 'facebook':
      return 'meta';
    case 'google':
      return 'google';
    case 'tiktok':
      return 'tiktok';
    default:
      return 'default';
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { user, businessId } = await getRequiredAppContext();
  const selection = await resolveCurrentSelection(businessId);
  const selectedPlatform = selection.selectedPlatformId
    ? await getPlatformDetails(selection.selectedPlatformId, businessId)
    : null;
  const platformTheme = resolvePlatformTheme(selectedPlatform?.vendorKey);

  return (
    <div className="app-platform-shell dv-app-shell" data-platform-theme={platformTheme}>
      <Sidebar />

      <div className="dv-app-content">
        <header className="app-platform-header dv-app-header">
          <Topbar user={user} businessId={businessId} />
        </header>

        <main className="app-platform-main dv-app-main">
          {children}
        </main>
      </div>
    </div>
  );
}
