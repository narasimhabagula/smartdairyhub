import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Android packaging for Smart Dairy Hub.
 *
 * The app ships the built web bundle (`dist/`) inside the APK, so it launches
 * as a real native app (no browser chrome, no address bar). No `server.url`
 * is set — that would turn the APK into a remote-website shell.
 */
const config: CapacitorConfig = {
  appId: 'online.smartdairyhub.app',
  appName: 'Smart Dairy Hub',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: false,
      splashImmersive: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#ffffff',
    },
  },
};

export default config;
