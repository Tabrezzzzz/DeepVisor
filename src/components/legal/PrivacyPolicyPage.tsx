import type { Metadata } from 'next';
import Link from 'next/link';

export const privacyPolicyMetadata: Metadata = {
  title: 'Privacy Policy | DeepVisor',
  description:
    'DeepVisor privacy policy covering account data, Meta integration data, AI processing, retention, data deletion, and user rights.',
};

const lastUpdated = 'June 20, 2026';

const highlights = [
  'We do not sell personal information.',
  'Connected ad platform data is used to operate dashboards, reports, sync, and recommendations.',
  'You can disconnect integrations and request deletion of account data.',
];

const sections = [
  {
    title: '1. Overview',
    body: [
      'DeepVisor helps businesses connect advertising accounts, review campaign performance, generate reports, and turn ad metrics into decision-support workflows. This Privacy Policy explains what information we collect, how we use it, and the choices available to you.',
      'This policy applies to DeepVisor websites, dashboards, integrations, reports, notifications, and related services that link to this policy.',
    ],
  },
  {
    title: '2. Information We Collect',
    body: [
      'Account information, including name, email address, phone number, authentication metadata, and account settings.',
      'Workspace information, including organization membership, business profile details, selected platform, selected ad account, notification preferences, onboarding answers, and calendar queue settings.',
      'Advertising integration information, including connected platform identifiers, ad account identifiers, OAuth connection metadata, campaign names and IDs, ad set names and IDs, ad names and IDs, delivery status, objectives, performance metrics, audience breakdown summaries, sync state, and report outputs.',
      'Generated intelligence, including campaign reviews, campaign reports, findings, recommendations, queue results, notifications, AI generation audit metadata, and account intelligence snapshots.',
      'Technical information, including IP address, browser or device metadata, logs, error reports, security events, and usage events needed to operate and improve the service.',
    ],
  },
  {
    title: '3. How We Use Information',
    body: [
      'We use information to create and secure accounts, connect platform integrations, sync ad performance data, generate dashboards and reports, run scheduled review workflows, provide notifications, improve product reliability, prevent abuse, and support users.',
      'DeepVisor uses deterministic calculations to identify what happened in an ad account. AI may be used to summarize, explain, prioritize, and draft reviewable next steps. AI does not directly publish, pause, extend, or change platform campaigns without explicit user approval.',
    ],
  },
  {
    title: '4. Meta And Other Platform Integrations',
    body: [
      'If you connect Meta or another advertising platform, DeepVisor processes data made available through that platform API and the permissions you grant. This may include business, page, Instagram, ad account, campaign, ad set, ad, creative, lead-related, and performance information depending on the permissions approved by the platform.',
      'You can disconnect an integration inside DeepVisor where available, or revoke access from the connected platform account settings. After disconnection, DeepVisor stops new sync activity for that integration, but previously stored records may remain until deleted under our retention process or by request.',
      'Third-party platforms are governed by their own terms and privacy policies. DeepVisor is not responsible for third-party platform availability, API changes, platform policy decisions, or data supplied by those platforms.',
    ],
  },
  {
    title: '5. AI Processing',
    body: [
      'Some report and campaign review workflows may send a limited, structured subset of ad performance metrics, findings, queue metadata, and business context to AI providers so DeepVisor can generate summaries or decision-support narratives.',
      'We do not intentionally send platform access tokens, passwords, or full authentication secrets to AI providers. AI outputs may be stored so users can view past reviews, audit queue results, and keep long-term account memory.',
    ],
  },
  {
    title: '6. How We Share Information',
    body: [
      'We do not sell personal information. We may share information with service providers that help us host, secure, analyze, support, and operate DeepVisor, such as database, hosting, analytics, communications, payment, platform API, and AI infrastructure providers.',
      'We may disclose information when required by law, to protect rights and safety, to prevent abuse, or as part of a merger, acquisition, financing, or business transfer.',
    ],
  },
  {
    title: '7. Data Retention',
    body: [
      'DeepVisor is designed to keep recent detailed ad performance data, compact long-term summaries, reports, findings, queue records, and account intelligence snapshots. Detailed high-volume rows may be retained for shorter periods while summaries and saved intelligence may be retained longer.',
      'We retain account and workspace data while your account is active and as needed for legitimate business, security, legal, and operational purposes. You may request deletion by contacting us.',
    ],
  },
  {
    title: '8. Data Deletion',
    body: [
      'To request deletion of your DeepVisor account data or connected platform data, email info@deepvisor.com from the email address associated with your account. Include the workspace or business name if available.',
      'We may need to retain limited records where required for security, fraud prevention, legal compliance, accounting, dispute resolution, or backup integrity. Deleted integration credentials are no longer used for platform API access.',
    ],
  },
  {
    title: '9. Security',
    body: [
      'We use administrative, technical, and organizational safeguards designed to protect information. No internet service can be guaranteed to be completely secure, and you are responsible for keeping your login credentials safe.',
      'Do not share platform access or DeepVisor credentials with unauthorized users. Contact us promptly if you believe your account or integration has been compromised.',
    ],
  },
  {
    title: '10. Your Choices And Rights',
    body: [
      'You can update account information, disconnect integrations, manage notification preferences, and request access, correction, export, or deletion of personal information by contacting us.',
      'Depending on where you live, you may have additional privacy rights. We will respond to valid requests as required by applicable law.',
    ],
  },
  {
    title: '11. Communications',
    body: [
      'We may send transactional messages about account security, integrations, queue results, reports, and product updates. We only send marketing SMS or WhatsApp messages where we have the required consent. You may opt out of marketing communications, but operational messages may still be necessary to provide the service.',
    ],
  },
  {
    title: '12. Children',
    body: [
      'DeepVisor is not directed to children under 13, and we do not knowingly collect personal information from children.',
    ],
  },
  {
    title: '13. Changes',
    body: [
      'We may update this Privacy Policy from time to time. If changes are material, we will provide notice through the site, dashboard, email, or another reasonable method.',
    ],
  },
  {
    title: '14. Contact',
    body: [
      'Questions, privacy requests, and data deletion requests can be sent to info@deepvisor.com.',
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-[#f7f9fc]">
      <section className="border-b border-blue-100 bg-[linear-gradient(180deg,#ffffff_0%,#f7f9fc_100%)] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">
              DeepVisor legal
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              Privacy Policy
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-slate-700">
              This page explains how DeepVisor handles account, workspace, Meta integration,
              advertising performance, report, and AI-assisted workflow data.
            </p>
            <p className="mt-4 text-sm text-slate-500">
              <strong>Last updated:</strong> {lastUpdated}
            </p>
          </div>

          <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
              Key points
            </h2>
            <ul className="mt-4 space-y-3">
              {highlights.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700">
                  <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-emerald-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link
              href="mailto:info@deepvisor.com"
              className="mt-5 inline-flex text-sm font-semibold text-blue-700 transition hover:text-blue-900"
            >
              Contact privacy support
            </Link>
          </aside>
        </div>
      </section>

      <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-9">
          {sections.map((section) => (
            <section key={section.title} className="border-b border-slate-200 pb-8 last:border-b-0">
              <h2 className="text-xl font-bold text-slate-950">{section.title}</h2>
              <div className="mt-3 space-y-3">
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="leading-7 text-slate-700">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </article>
    </div>
  );
}
