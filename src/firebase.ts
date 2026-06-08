import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import appletConfig from "../firebase-applet-config.json";

// We combine configuration to support both the AI Studio preview environment
// and external deployments like Railway using environment variables.
const firebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || appletConfig.apiKey || "AI_STUDIO_OR_CONSOLE_API_KEY_PLACEHOLDER",
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || appletConfig.authDomain || "birthday-buddy-registry.firebaseapp.com",
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || appletConfig.projectId || "birthday-buddy-registry",
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || appletConfig.storageBucket || "birthday-buddy-registry.appspot.com",
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || appletConfig.messagingSenderId || "123456789012",
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || appletConfig.appId || "1:123456789012:web:abcdef123456",
  firestoreDatabaseId: (import.meta as any).env?.VITE_FIREBASE_DATABASE_ID || appletConfig.firestoreDatabaseId || ""
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// CRITICAL: The app will fail in AI Studio if firestoreDatabaseId is not supplied.
// We fallback to standard initialization when VITE_FIREBASE_DATABASE_ID or Applet configuration are empty.
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Strict compliance validation to ensure Firestore connects properly
export async function checkFirestoreConnection() {
  try {
    const { doc, getDocFromServer } = await import("firebase/firestore");
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.warn("[Firebase] Offline. Please check your internet or Firebase configuration.");
    }
  }
}

// Ensure the connection is tested at boot
checkFirestoreConnection();

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

/**
 * Compliance-hardened Firestore error handler required by Firebase Integration guidelines.
 * Collects runtime security context to diagnose rule violations properly.
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error("Firestore Error context logged: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
