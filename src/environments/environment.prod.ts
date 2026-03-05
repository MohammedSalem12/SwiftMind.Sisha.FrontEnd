import { Environment } from '@abp/ng.core';

const baseUrl = 'http://localhost:4200';

export const environment = {
  production: true,
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
    sessionChecksEnabled: false,
    automaticSilentRefresh: true,
    useSilentRefresh: false,
    timeoutFactor: 0.75,
  },
  apis: {
    default: {
      url: 'https://localhost:44367',
      rootNamespace: 'SwiftMind.Sesha',
    },
  },
} as Environment;
