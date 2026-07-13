// ============================================================
// PRODUCTION environment — self-hosted VPS (46.224.134.126)
//   Frontend + Backend are served from the SAME origin by nginx on the VPS.
//   Used by `npm run build:prod` (ng build --configuration production).
//   Test counterpart: environment.ts
//
// Let's Encrypt cannot issue a certificate for a bare IP address, so the app is
// reached through sslip.io — a wildcard DNS service that resolves
// 46-224-134-126.sslip.io -> 46.224.134.126. That yields a real hostname and a
// genuine, browser-trusted certificate.
//
// To move to a real domain: change the two constants below, re-issue the cert,
// and re-run the DbMigrator (OpenIddict redirect URIs are seeded into the DB).
// ============================================================
import { Environment } from '@abp/ng.core';

const baseUrl = 'https://46-224-134-126.sslip.io';
const backendUrl = 'https://46-224-134-126.sslip.io';

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
  },
  apis: {
    default: {
      url: backendUrl,
      rootNamespace: 'SwiftMind.Sesha',
    },
  },
  // Social login. The Google OAuth client must list the origin above as an
  // Authorized JavaScript origin.
  googleClientId: '1092548471447-c3m8tge7gh1tuiipvtcdnd1aohvs8a67.apps.googleusercontent.com',
  facebookAppId: 'YOUR_FACEBOOK_APP_ID', // TODO: set from your Meta app
} as Environment;
