/**
 * Firebase configuration — 100% environment driven.
 *
 * Nothing here is ever hardcoded. Every app (customer / partner / rider /
 * admin) reads the same variables from its own `.env` file, so development,
 * staging and production point at different Firebase projects with no code
 * change.
 *
 *   VITE_FIREBASE_API_KEY
 *   VITE_FIREBASE_AUTH_DOMAIN
 *   VITE_FIREBASE_PROJECT_ID
 *   VITE_FIREBASE_STORAGE_BUCKET
 *   VITE_FIREBASE_MESSAGING_SENDER_ID
 *   VITE_FIREBASE_APP_ID
 *   VITE_APPLE_SIGN_IN_ENABLED   ("true" only on iOS/web builds)
 */

export type FirebaseWebConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

type ViteEnv = Record<string, string | boolean | undefined>;

function env(): ViteEnv {
  try {
    return (import.meta.env ?? {}) as ViteEnv;
  } catch {
    return {};
  }
}

function readString(key: string): string {
  const value = env()[key];
  return typeof value === "string" ? value.trim() : "";
}

export function firebaseConfig(): FirebaseWebConfig {
  return {
    apiKey: readString("VITE_FIREBASE_API_KEY"),
    authDomain: readString("VITE_FIREBASE_AUTH_DOMAIN"),
    projectId: readString("VITE_FIREBASE_PROJECT_ID"),
    storageBucket: readString("VITE_FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: readString("VITE_FIREBASE_MESSAGING_SENDER_ID"),
    appId: readString("VITE_FIREBASE_APP_ID"),
  };
}

/** True once the Firebase web credentials exist for this environment. */
export function isFirebaseConfigured(): boolean {
  const config = firebaseConfig();
  return Boolean(config.apiKey && config.authDomain && config.projectId && config.appId);
}

/** Apple Sign In is prepared but stays disabled unless explicitly turned on. */
export function isAppleSignInEnabled(): boolean {
  return readString("VITE_APPLE_SIGN_IN_ENABLED").toLowerCase() === "true";
}
