import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, type Auth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
}

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey.trim() !== '' &&
  !firebaseConfig.apiKey.includes('your-')
)

let app: any = null
let authInstance: Auth | null = null

if (isFirebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
    authInstance = getAuth(app)
  } catch (error) {
    console.warn('Firebase initialization error:', error)
  }
}

export const auth = authInstance

export interface FirebaseGoogleUser {
  email: string
  firstName: string
  lastName: string
  googleId: string
  avatarUrl?: string
}

export async function signInWithGoogleFirebase(): Promise<FirebaseGoogleUser> {
  if (!authInstance) {
    throw new Error('Firebase is not configured. Please add your Firebase credentials to .env')
  }

  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({
    prompt: 'select_account',
  })

  const result = await signInWithPopup(authInstance, provider)
  const user = result.user

  if (!user.email) {
    throw new Error('No email found in Google account')
  }

  const displayName = user.displayName || ''
  const nameParts = displayName.trim().split(' ')
  const firstName = nameParts[0] || 'User'
  const lastName = nameParts.slice(1).join(' ') || ''

  return {
    email: user.email,
    firstName,
    lastName,
    googleId: user.uid,
    avatarUrl: user.photoURL || undefined,
  }
}
