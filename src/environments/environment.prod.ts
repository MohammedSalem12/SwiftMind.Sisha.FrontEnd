// ============================================================
// PRODUCTION environment
//   Frontend: Firebase Hosting (sesha-9999.web.app)
//   Backend: public HTTPS (currently the ngrok static tunnel → DB: Sesha_Staging)
//   Used by `npm run build:prod` (ng build --configuration production).
//   Test counterpart: environment.ts
// ============================================================
import { Environment } from '@abp/ng.core';

// Frontend production URL (Firebase hosting)
const baseUrl = 'https://sesha-9999.web.app';

// ngrok tunnel URL — update this each time you restart ngrok
const backendUrl = 'https://overvaluable-nonequilateral-henriette.ngrok-free.dev';

export const environment = {
  production: true,
  application: {
    baseUrl,
    name: 'KAI',
    logoUrl: '',
  },
  oAuthConfig: {
    issuer: `${backendUrl}/`,
    redirectUri: baseUrl,
    clientId: 'Sesha_App',
    responseType: 'code',
    scope: 'offline_access Sesha',
    requireHttps: true,
    sessionChecksEnabled: false,
    automaticSilentRefresh: true,
    useSilentRefresh: false,
    timeoutFactor: 0.75,
    // Override endpoints — discovery returns localhost URLs which don't work from Firebase
    tokenEndpoint: `${backendUrl}/connect/token`,
    userinfoEndpoint: `${backendUrl}/connect/userinfo`,
    skipIssuerCheck: true,
    strictDiscoveryDocumentValidation: false,
  },
  apis: {
    default: {
      url: backendUrl,
      rootNamespace: 'SwiftMind.Sesha',
    },
  },
  // Social login (must match the test env). Google OAuth client must list
  // https://sesha-9999.web.app as an Authorized JavaScript origin.
  googleClientId: '1092548471447-c3m8tge7gh1tuiipvtcdnd1aohvs8a67.apps.googleusercontent.com',
  facebookAppId: 'YOUR_FACEBOOK_APP_ID', // TODO: set from your Meta app
} as Environment;
