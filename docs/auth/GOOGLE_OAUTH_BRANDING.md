# Google Sign-In branding — "to continue to Smart Dairy Hub"

The text and logo in Google's account chooser ("Choose an account · to continue to X")
come **entirely from the Google Cloud OAuth client / consent screen** of whichever
OAuth app initiates the flow. It cannot be changed from frontend code, and faking the
chooser is not an option.

Today the app uses the platform's **managed** Google credentials, so Google shows the
platform's app name. To show *Smart Dairy Hub*, the project must use **its own Google
OAuth client** (BYOK). Steps:

1. Google Cloud Console → APIs & Services → **OAuth consent screen**
   - App name: `Smart Dairy Hub`
   - App logo: upload `public/oauth-logo.png` (the official round Smart Dairy Hub logo,
     unmodified, square, 120×120 min) — Google may require brand verification for the
     logo to appear publicly.
   - Support email + developer contact email: your Smart Dairy Hub address
   - Authorised domains: `smartdairyhub.online`
   - Scopes (non-sensitive only): `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile`
2. **Credentials → Create credentials → OAuth client ID → Web application**
   - Authorised redirect URI: the callback URL shown in the app's backend
     Auth Settings → Sign-in methods → Google.
3. Paste the generated **Client ID** and **Client Secret** into
   backend **Users → Authentication Settings → Sign-in methods → Google**, switching the
   provider from managed to your own credentials.
4. Submit the consent screen for verification (required for the logo + app name to show
   to all users; unverified apps show the name but may warn).

No frontend change is needed — `lovable.auth.signInWithOAuth("google", …)` in
`src/pages/Login.tsx` keeps working unchanged and immediately picks up the new branding.
