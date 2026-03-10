import { Environment } from '@abp/ng.core';

// Frontend production URL (Firebase hosting)
const baseUrl = 'https://sesha-9999.web.app';

// ngrok tunnel URL — update this each time you restart ngrok
const backendUrl = 'https://overvaluable-nonequilateral-henriette.ngrok-free.dev';

export const environment = {
  production: true,
  application: {
    baseUrl,
    name: 'Sesha',
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
  googleClientId: '1092548471447-c3m8tge7gh1tuiipvtcdnd1aohvs8a67.apps.googleusercontent.com',
} as Environment;
