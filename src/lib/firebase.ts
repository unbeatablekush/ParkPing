import { initializeApp, getApps } from 'firebase/app'
import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

const missingKeys = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key)

if (missingKeys.length > 0) {
  const errorMessage = `[Firebase] missing required environment variables: ${missingKeys.join(', ')}`
  if (typeof window === 'undefined') {
    // On server-side, fail fast so you can catch config errors early.
    throw new Error(errorMessage)
  }
  // On client-side, keep app null and log.
  console.error(errorMessage)
}

const app =
  missingKeys.length === 0 && getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApps().length > 0
    ? getApps()[0]
    : null

let messaging: Messaging | null = null

if (app && typeof window !== 'undefined') {
  try {
    messaging = getMessaging(app)
  } catch (err) {
    console.warn('Firebase messaging not supported in this browser', err)
  }
}

export { messaging, getToken, onMessage }
