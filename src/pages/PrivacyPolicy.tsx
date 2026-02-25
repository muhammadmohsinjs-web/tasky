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
            <h2 className="text-base font-semibold text-slate-900">1. Data collection</h2>
            <p className="mt-2">
              {APP_NAME} collects account profile details (name, email, avatar), tasks, categories, and product usage metadata required to operate the app.
            </p>
            <p className="mt-2">
              When you sign in with Google, {APP_NAME} receives basic identity scopes (<code>openid email profile</code>) for authentication and account identity.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">2. Data usage</h2>
            <p className="mt-2">
              {APP_NAME} uses Google user data only for secure sign-in and account identification.
            </p>
            <p className="mt-2">
              Google Calendar sync is currently disabled in the product. We do not request Google Calendar API scopes in the active app flow.
            </p>
            <p className="mt-2">
              {APP_NAME} does not sell Google user data, does not use Google user data for advertising, and does not use Google user data to train generalized AI or ML models.
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
            <h2 className="text-base font-semibold text-slate-900">3. Data storage and security</h2>
            <p className="mt-2">
              Data is transmitted over HTTPS and stored in Supabase-managed infrastructure used by {APP_NAME}. OAuth access tokens are short-lived and used to maintain authenticated sessions.
            </p>
            <p className="mt-2">
              Access to stored data is limited to systems and personnel required to operate, secure, and support {APP_NAME}.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">4. Data sharing and transfer</h2>
            <p className="mt-2">
              {APP_NAME} shares Google user data only with service providers needed to run the app infrastructure (such as hosting and database providers acting as processors on our behalf).
            </p>
            <p className="mt-2">
              {APP_NAME} does not sell Google user data or share Google user data with third parties for independent advertising or marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">5. Data retention</h2>
            <p className="mt-2">
              Google OAuth identity data is retained while your account is active to support authentication.
            </p>
            <p className="mt-2">
              Task and account data remain available until you delete them or request account deletion.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">6. Your controls and deletion requests</h2>
            <p className="mt-2">
              You can revoke Google access from your Google Account security settings at any time.
            </p>
            <p className="mt-2">
              For full account data deletion requests, email
              {' '}
              <a href={legalMailto('TasksPulse data deletion request')} className="text-blue-700 hover:text-blue-800">{SUPPORT_EMAIL}</a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">7. Contact</h2>
            <p className="mt-2">
              Support: <a href={legalMailto('TasksPulse support request')} className="text-blue-700 hover:text-blue-800">{SUPPORT_EMAIL}</a>
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
