import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.quickpress.customer",
  appName: "QuickPress Customer",
  webDir: ".output/public",
  android: {
    allowMixedContent: true,
  },
  server: {
    url: "http://192.168.31.84:8081",
    cleartext: true,
    androidScheme: "http",
  },
};

export default config;
