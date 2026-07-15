import { AlertTriangle, BarChart3, CheckCircle2, FileText, ImageOff, Lightbulb, type LucideIcon } from 'lucide-react';

export const metadata = {
  title: 'Performance Marketing Command Center | DeepVisor',
  description:
    'Monitor paid ad performance, detect wasted spend, track ROAS and CPL, generate reports, and review AI-recommended next actions.',
};

const features: Array<{ title: string; detail: string; icon: LucideIcon }> = [
  { title: 'Performance snapshot', detail: 'Track spend, revenue, ROAS, CPL, CAC, qualified leads, and conversion rate.', icon: BarChart3 },
  { title: 'Waste detection', detail: 'Spot campaigns and ad sets spending without enough lead quality or revenue signal.', icon: AlertTriangle },
  { title: 'Creative fatigue', detail: 'Flag ads where frequency rises, CTR drops, and creative refresh is needed.', icon: ImageOff },
  { title: 'AI recommendations', detail: 'Review budget shifts, pause candidates, and creative refresh actions before execution.', icon: Lightbulb },
  { title: 'Client reports', detail: 'Prepare weekly performance summaries, waste reports, and campaign winner analysis.', icon: FileText },
  { title: 'Approval queue', detail: 'Keep humans in control with approve, reject, and edit flows for every action.', icon: CheckCircle2 },
];

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-[#f4f4f1] px-6 py-16 text-black">
      <section className="mx-auto max-w-7xl">
        <span className="inline-flex rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#fd4b23]">
          Features
        </span>
        <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[0.95] tracking-[-0.05em] md:text-7xl">
          Built for paid ad decisions, not generic analytics.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-black/65">
          DeepVisor helps marketing teams turn campaign data into clear reports, spend alerts, and next actions that can be reviewed before execution.
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map(({ title, detail, icon: Icon }) => (
            <article key={title} className="rounded-xl border border-black/10 bg-white p-6">
              <Icon size={22} strokeWidth={1.6} className="text-[#fd4b23]" />
              <h2 className="mt-6 text-2xl font-black tracking-[-0.03em]">{title}</h2>
              <p className="mt-3 leading-7 text-black/60">{detail}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
