import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.swiftmind.kai',
  appName: 'KAI',
  webDir: 'dist/Sesha',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#3880ff',
      showSpinner: true,
      spinnerColor: '#ffffff'
    }
  }
};

export default config;
