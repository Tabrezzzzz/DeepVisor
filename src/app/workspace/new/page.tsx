import WorkspaceCreateClient from './components/WorkspaceCreateClient';
import { getLoggedInUserOrRedirect } from '@/lib/server/actions/user/account';

export default async function WorkspaceCreatePage() {
  await getLoggedInUserOrRedirect();

  return <WorkspaceCreateClient />;
}
