import { Link } from 'react-router-dom'
import { APP_NAME, SUPPORT_EMAIL, legalMailto } from '../lib/legal'

export default function GoogleApiDisclosure() {
  return (
    <main className="min-h-screen bg-[#f4f7fb] px-6 py-10 text-slate-700">
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Google API Disclosure</h1>
        <p className="mt-2 text-sm text-slate-500">How {APP_NAME} uses Google user data for calendar functionality.</p>

        <div className="mt-8 space-y-6 text-sm leading-6">
          <section>
            <h2 className="text-base font-semibold text-slate-900">Scopes and purpose</h2>
            <p className="mt-2"><code>openid email profile</code>: authentication and account identity.</p>
            <p className="mt-2"><code>https://www.googleapis.com/auth/calendar.calendarlist.readonly</code>: list calendars so users can choose a target calendar.</p>
            <p className="mt-2"><code>https://www.googleapis.com/auth/calendar.events</code>: create/update/delete synced events for task scheduling and read event details for the events view.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">What is stored</h2>
            <p className="mt-2">Stored data includes OAuth tokens, selected calendar ID, sync queue state, and event mapping IDs needed for sync reliability.</p>
            <p className="mt-2">{APP_NAME} does not use Google data for advertising or data brokerage.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">How to revoke and delete</h2>
            <p className="mt-2">Use <strong>Disconnect Google</strong> in Dashboard to revoke tokens and remove stored Google sync metadata.</p>
            <p className="mt-2">You can also revoke app access directly in your Google Account security settings.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">Questions</h2>
            <p className="mt-2">Email <a href={legalMailto('Google API data question')} className="text-blue-700 hover:text-blue-800">{SUPPORT_EMAIL}</a>.</p>
          </section>
        </div>

        <div className="mt-8 flex flex-wrap gap-4 text-sm">
          <Link to="/privacy" className="text-blue-700 hover:text-blue-800">Privacy Policy</Link>
          <Link to="/terms" className="text-blue-700 hover:text-blue-800">Terms of Service</Link>
          <Link to="/support" className="text-blue-700 hover:text-blue-800">Support</Link>
        </div>
      </div>
    </main>
  )
}
