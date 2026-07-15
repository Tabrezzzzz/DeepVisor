import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/server/supabase/admin';

type PageProps = {
  params: Promise<{
    confirmationCode: string;
  }>;
};

function formatStatus(value: string): string {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export default async function DataDeletionStatusPage({ params }: PageProps) {
  const { confirmationCode } = await params;
  const supabase = createAdminClient();
  const { data, error } = await (supabase as any)
    .from('provider_data_deletion_requests')
    .select('provider, confirmation_code, status, requested_at, completed_at')
    .eq('confirmation_code', confirmationCode)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc] px-4 py-16 text-slate-950">
      <section className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#fd4b23]">
          Data deletion request
        </p>
        <h1 className="mt-4 text-3xl font-bold">Request received</h1>
        <p className="mt-4 leading-7 text-slate-600">
          DeepVisor has received a verified {String(data.provider).toUpperCase()} data deletion
          callback. We process deletion requests according to our privacy policy and keep this page
          available as confirmation of receipt and status.
        </p>

        <dl className="mt-8 grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-5 text-sm">
          <div>
            <dt className="font-semibold text-slate-500">Confirmation code</dt>
            <dd className="mt-1 font-mono text-slate-950">{data.confirmation_code}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-500">Status</dt>
            <dd className="mt-1">{formatStatus(String(data.status))}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-500">Requested</dt>
            <dd className="mt-1">{new Date(String(data.requested_at)).toLocaleString()}</dd>
          </div>
          {data.completed_at ? (
            <div>
              <dt className="font-semibold text-slate-500">Completed</dt>
              <dd className="mt-1">{new Date(String(data.completed_at)).toLocaleString()}</dd>
            </div>
          ) : null}
        </dl>

        <p className="mt-6 text-sm leading-6 text-slate-500">
          For questions about this request, contact privacy support at info@deepvisor.com and
          include the confirmation code above.
        </p>
      </section>
    </main>
  );
}
