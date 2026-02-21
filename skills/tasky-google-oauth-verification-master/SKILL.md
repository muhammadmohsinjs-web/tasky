---
name: tasky-google-oauth-verification-master
description: Expert workflow for Google OAuth app verification readiness and gap closure. Use when prompts mention Google OAuth verification, unverified app warning, OAuth consent screen policies, sensitive/restricted scopes, domain verification, verification submission, or policy compliance fixes.
---

# Tasky Google OAuth Verification Master

## When to use
Use this skill for any request to make the app pass Google OAuth verification, especially when the app shows unverified warnings or uses sensitive/restricted scopes.

## Outcome
Deliver a verifiable OAuth implementation with:
- policy-compliant consent screen fields,
- least-privilege scopes and strong justifications,
- complete legal/support/domain artifacts,
- secure token lifecycle and data handling,
- submission-ready evidence package.

## Required execution flow
1. Run a verification gap audit first.
2. Rank gaps by blocker level:
- Blocker: verification cannot be approved.
- Major: likely rejection or resubmission.
- Minor: quality/completeness issue.
3. Implement missing technical pieces directly in code/config/docs.
4. Generate a submission package checklist with exact evidence links/files.

## Gap audit checklist
- App identity consistency:
- Product name, logo, homepage, privacy policy, terms, and support email match across app and Google Cloud OAuth config.
- Authorized domains:
- All OAuth redirect origins and links are on verified domains.
- Scope minimization:
- Scopes are strictly required for shipped functionality and no broader.
- Scope justification:
- Each sensitive/restricted scope has a one-line user-facing reason and a backend reason.
- Data handling:
- Clear collection/use/storage/deletion behavior exists and is implemented.
- User controls:
- Revoke/disconnect flow and account data deletion flow exist and work.
- Security posture:
- Tokens are protected at rest and in transit; refresh token failures are handled safely.
- Reviewer access:
- Test account, reproducible steps, and a stable review environment are available.

## Implementation standards
- Prefer minimal OAuth scopes and remove unused scopes in code.
- Ensure redirect URIs are exact and environment-safe.
- Add robust handling for `invalid_grant`, revoked tokens, and re-consent states.
- Ensure disconnected accounts stop sync jobs and clear active channels.
- Ensure privacy policy describes Google API data use and retention accurately.
- Include an in-product data deletion path or documented request flow.

## Submission package requirements
Produce/verify all of the following:
- Verification notes mapped scope -> feature -> UI location.
- Reviewer test user credentials and setup steps.
- End-to-end demo steps (login, grant scopes, use feature, revoke/disconnect).
- Public policy URLs (privacy, terms, support) on verified domain.
- Statement confirming Google API Services User Data Policy compliance.

## Guardrails
- Do not request restricted scopes unless feature-critical and justified.
- Do not ship placeholder legal pages for verification.
- Do not keep stale or unused redirect URIs/origins.
- Do not treat policy text as complete without matching product behavior.

## Delivery format for this skill
- Start with a blocker-first gap report.
- Then implement fixes (code + config + docs) in descending risk order.
- End with a submission-ready checklist and residual risk list.

