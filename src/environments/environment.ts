import { Environment } from '@abp/ng.core';

const baseUrl = 'http://localhost:4200';

export const environment = {
  production: false,
  application: {
    baseUrl,
    name: 'Sesha',
    logoUrl: '',
  },
  oAuthConfig: {
    issuer: 'https://localhost:44367/',
    redirectUri: baseUrl,
    clientId: 'Sesha_App',
    responseType: 'code',
    scope: 'offline_access Sesha',
    requireHttps: true,
    // Prevent redirecting to the backend's /Account/Login when the token expires.
    // Instead, use the refresh_token grant automatically, and fall back to
    // the Angular /login page (handled in AppComponent) if the refresh fails.
    sessionChecksEnabled: false,   // disable iframe session checks
    automaticSilentRefresh: true,  // auto-refresh access token before it expires
    useSilentRefresh: false,       // use refresh_token grant, not an iframe
    timeoutFactor: 0.75,           // refresh at 75% of the token's lifetime
  },
  apis: {
    default: {
      url: 'https://localhost:44367',
      rootNamespace: 'SwiftMind.Sesha',
    },
  },
  googleClientId: '1092548471447-c3m8tge7gh1tuiipvtcdnd1aohvs8a67.apps.googleusercontent.com',
} as Environment;
