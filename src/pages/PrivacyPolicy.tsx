import { Link } from 'react-router-dom'
import { APP_NAME, LEGAL_EFFECTIVE_DATE, SUPPORT_EMAIL, getPublicAppUrl, legalMailto } from '../lib/legal'

export default function PrivacyPolicy() {
  const appUrl = getPublicAppUrl()

  return (
    <main className="min-h-screen bg-[#f4f7fb] px-6 py-10 text-slate-700">
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Privacy Policy</h1>
        <p className="mt-2 text-sm text-slate-500">Effective date: {LEGAL_EFFECTIVE_DATE}</p>

        <div className="mt-8 space-y-6 text-sm leading-6">
          <section>
            <h2 className="text-base font-semibold text-slate-900">1. Data we collect</h2>
            <p className="mt-2">
              {APP_NAME} stores account profile details (name, email, avatar), tasks, categories, and Google Calendar sync metadata when you connect Google.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">2. Google API data use</h2>
            <p className="mt-2">
              {APP_NAME} uses Google Calendar scopes only to read your selected calendars/events and create, update, or delete calendar events that correspond to tasks you manage in {APP_NAME}. We do not sell Google user data.
            </p>
            <p className="mt-2">
              {APP_NAME}'s use and transfer of information received from Google APIs adheres to the
              {' '}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noreferrer"
                className="text-blue-700 hover:text-blue-800"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">3. Storage, retention, and security</h2>
            <p className="mt-2">
              Data is transmitted over HTTPS and stored in Supabase-managed infrastructure. OAuth access tokens are short-lived and refresh tokens are stored only to maintain user-approved background sync.
            </p>
            <p className="mt-2">
              We keep Google sync metadata until you disconnect Google Calendar or delete your account data. Internal task records are retained until you remove them.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">4. Your controls</h2>
            <p className="mt-2">
              You can disconnect Google at any time from the Dashboard using <strong>Disconnect Google</strong>. This revokes stored Google tokens and deletes synced Google metadata in {APP_NAME}.
            </p>
            <p className="mt-2">
              For full account data deletion requests, email
              {' '}
              <a href={legalMailto('Tasky data deletion request')} className="text-blue-700 hover:text-blue-800">{SUPPORT_EMAIL}</a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">5. Contact</h2>
            <p className="mt-2">
              Support: <a href={legalMailto('Tasky support request')} className="text-blue-700 hover:text-blue-800">{SUPPORT_EMAIL}</a>
            </p>
            <p className="mt-2">
              Product URL: <a href={appUrl} className="text-blue-700 hover:text-blue-800">{appUrl}</a>
            </p>
          </section>
        </div>

        <div className="mt-8 flex flex-wrap gap-4 text-sm">
          <Link to="/terms" className="text-blue-700 hover:text-blue-800">Terms of Service</Link>
          <Link to="/support" className="text-blue-700 hover:text-blue-800">Support</Link>
          <Link to="/google-api-disclosure" className="text-blue-700 hover:text-blue-800">Google API Disclosure</Link>
        </div>
      </div>
    </main>
  )
}
