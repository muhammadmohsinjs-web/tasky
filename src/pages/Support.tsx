import { Link } from 'react-router-dom'
import { APP_NAME, SUPPORT_EMAIL, legalMailto } from '../lib/legal'

export default function Support() {
  return (
    <main className="min-h-screen bg-[#f4f7fb] px-6 py-10 text-slate-700">
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Support</h1>
        <p className="mt-2 text-sm text-slate-500">For product support, verification reviewer questions, and data requests.</p>

        <div className="mt-8 space-y-6 text-sm leading-6">
          <section>
            <h2 className="text-base font-semibold text-slate-900">Contact channels</h2>
            <p className="mt-2">
              Primary support email:
              {' '}
              <a href={legalMailto('TasksPulse support request')} className="text-blue-700 hover:text-blue-800">{SUPPORT_EMAIL}</a>
            </p>
            <p className="mt-2">
              Reviewer subject line suggestion:
              {' '}
              <a href={legalMailto('Google OAuth verification review')} className="text-blue-700 hover:text-blue-800">Google OAuth verification review</a>
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">Data deletion options</h2>
            <p className="mt-2">
              In-product Google data deletion: open Dashboard and click <strong>Disconnect Google</strong>.
            </p>
            <p className="mt-2">
              Full account/data deletion request: email
              {' '}
              <a href={legalMailto('TasksPulse full data deletion request')} className="text-blue-700 hover:text-blue-800">{SUPPORT_EMAIL}</a>
              {' '}
              with your account email.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">Expected response</h2>
            <p className="mt-2">{APP_NAME} support responses are typically sent within 2 business days.</p>
          </section>
        </div>

        <div className="mt-8 flex flex-wrap gap-4 text-sm">
          <Link to="/privacy" className="text-blue-700 hover:text-blue-800">Privacy Policy</Link>
          <Link to="/terms" className="text-blue-700 hover:text-blue-800">Terms of Service</Link>
        </div>
      </div>
    </main>
  )
}
