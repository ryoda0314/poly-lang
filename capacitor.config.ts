import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.polylinga.ios",
  appName: "PolyLinga",
  webDir: "out",
  server: {
    // Production URL - app loads from hosted site
    url: "https://polylinga.app",
    cleartext: false,
  },
  ios: {
    contentInset: "automatic",
    preferredContentMode: "mobile",
    scheme: "PolyLinga",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#F9F8F4",
      showSpinner: false,
    },
  },
};

export default config;
