import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.relationshipscores.app',
  appName: 'Relationship Scores',
  webDir: 'dist',
  server: {
    // Use the live backend for all API calls
    url: 'https://date-production-5ca0.up.railway.app',
    cleartext: false,
  },
  ios: {
    contentInset: 'always',
    backgroundColor: '#0F0F0F',
    preferredContentMode: 'mobile',
  },
  android: {
    backgroundColor: '#0F0F0F',
    allowMixedContent: false,
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0F0F0F',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0F0F0F',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
  },
};

export default config;
