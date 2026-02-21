import { Link } from 'react-router-dom'
import { APP_NAME, LEGAL_EFFECTIVE_DATE, SUPPORT_EMAIL, legalMailto } from '../lib/legal'

export default function TermsOfService() {
  return (
    <main className="min-h-screen bg-[#f4f7fb] px-6 py-10 text-slate-700">
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Terms of Service</h1>
        <p className="mt-2 text-sm text-slate-500">Effective date: {LEGAL_EFFECTIVE_DATE}</p>

        <div className="mt-8 space-y-6 text-sm leading-6">
          <section>
            <h2 className="text-base font-semibold text-slate-900">1. Service scope</h2>
            <p className="mt-2">
              {APP_NAME} is a task planning and calendar sync product. You may use it only in compliance with applicable laws and these terms.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">2. Accounts and access</h2>
            <p className="mt-2">
              You are responsible for activity under your account and for protecting your sign-in credentials. We may suspend access for abuse, fraud, or policy violations.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">3. Google integration</h2>
            <p className="mt-2">
              If you connect Google, you authorize {APP_NAME} to access only the scopes shown on the consent screen for calendar synchronization features. You can revoke access any time from Google account settings or by disconnecting inside {APP_NAME}.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">4. Availability and changes</h2>
            <p className="mt-2">
              We may update the service and these terms over time. Material changes will be reflected by updating the effective date on this page.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">5. Contact</h2>
            <p className="mt-2">
              Questions or legal notices: <a href={legalMailto('Tasky legal request')} className="text-blue-700 hover:text-blue-800">{SUPPORT_EMAIL}</a>
            </p>
          </section>
        </div>

        <div className="mt-8 flex flex-wrap gap-4 text-sm">
          <Link to="/privacy" className="text-blue-700 hover:text-blue-800">Privacy Policy</Link>
          <Link to="/support" className="text-blue-700 hover:text-blue-800">Support</Link>
        </div>
      </div>
    </main>
  )
}
