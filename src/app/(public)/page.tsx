import Link from 'next/link';
import { AlertTriangle, CheckCircle2, FileText, Lightbulb, TrendingUp, Wallet, type LucideIcon } from 'lucide-react';

export default function PublicHomePage() {
  const snapshot: Array<{ label: string; value: string; icon: LucideIcon }> = [
    { label: 'Total Spend', value: '₹2,48,000', icon: Wallet },
    { label: 'ROAS', value: '3.4x', icon: TrendingUp },
    { label: 'Waste Risk', value: '₹38,500', icon: AlertTriangle },
    { label: 'Reports Ready', value: '2', icon: FileText },
  ];

  return (
    <main className="min-h-screen bg-[#f4f4f1] text-black">
      <section className="mx-auto grid min-h-screen max-w-7xl items-center gap-8 px-6 py-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <span className="inline-flex rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#fd4b23]">
            DeepVisor
          </span>
          <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[0.93] tracking-[-0.05em] md:text-7xl">
            AI Performance Marketing Command Center
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-black/65">
            Track ad spend, ROAS, CPL, CAC, lead quality, creative fatigue, wasted budget, campaign winners,
            weak campaigns, and approval-ready next actions from one focused dashboard.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/sign-up" className="rounded-lg bg-[#fd4b23] px-5 py-3 text-sm font-black text-white">
              Start free test
            </Link>
            <Link href="/dashboard" className="rounded-lg border border-black/15 bg-white px-5 py-3 text-sm font-black">
              View dashboard
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-black/10 bg-white p-4 shadow-[0_24px_80px_rgba(0,0,0,0.10)]">
          <div className="rounded-lg bg-black p-5 text-white">
            <div className="mb-8 flex items-center justify-between text-sm text-white/70">
              <span>Performance snapshot</span>
              <TrendingUp size={18} strokeWidth={1.6} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {snapshot.map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
                  <Icon size={18} strokeWidth={1.6} className="text-[#fd4b23]" />
                  <p className="mt-5 text-xs font-bold uppercase tracking-[0.12em] text-white/45">{label}</p>
                  <strong className="mt-2 block text-2xl">{value}</strong>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-lg border border-[#fd4b23]/40 bg-[#fd4b23]/10 p-4">
              <div className="flex items-start gap-3">
                <Lightbulb size={18} strokeWidth={1.6} className="mt-1 text-[#fd4b23]" />
                <p className="text-sm text-white/80">Shift 15% budget to Google Search - High Intent Leads.</p>
              </div>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {['Spend alerts', 'Executive reports', 'Approval queue'].map((item) => (
              <div key={item} className="flex items-center gap-2 rounded-lg border border-black/10 p-3 text-sm font-bold">
                <CheckCircle2 size={16} strokeWidth={1.6} className="text-[#fd4b23]" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
