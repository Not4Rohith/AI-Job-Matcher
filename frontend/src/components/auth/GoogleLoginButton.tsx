import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/api/endpoints'
import { useAuthStore } from '@/store/authStore'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'
import { isFirebaseConfigured, signInWithGoogleFirebase, type FirebaseGoogleUser } from '@/lib/firebase'

interface GoogleLoginButtonProps {
  mode?: 'signin' | 'signup'
  redirectTo?: string
}

export default function GoogleLoginButton({
  mode = 'signin',
  redirectTo = '/profile',
}: GoogleLoginButtonProps) {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  const googleMutation = useMutation({
    mutationFn: authApi.googleLogin,
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken)
      toast.success(
        mode === 'signup'
          ? `Welcome to HireMatch AI, ${data.user.firstName || 'Candidate'}!`
          : `Signed in as ${data.user.email}`
      )
      navigate(redirectTo)
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Google sign-in failed. Please try again.')
    },
  })

  const handleGoogleClick = async () => {
    if (!isFirebaseConfigured) {
      toast.error('Firebase configuration not found in .env. Please add your Firebase project keys.')
      return
    }

    setIsAuthenticating(true)
    try {
      const googleUser: FirebaseGoogleUser = await signInWithGoogleFirebase()
      googleMutation.mutate({
        email: googleUser.email,
        firstName: googleUser.firstName,
        lastName: googleUser.lastName,
        googleId: googleUser.googleId,
        avatarUrl: googleUser.avatarUrl,
      })
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user') {
        toast('Google sign-in popup was closed', { icon: 'ℹ️' })
      } else if (err?.code === 'auth/cancelled-popup-request') {
        // Ignored: popup superseded
      } else if (err?.code === 'auth/unauthorized-domain') {
        toast.error('Domain not authorized in Firebase Console. Add localhost to Authorized Domains.')
      } else if (err?.code === 'auth/operation-not-allowed') {
        toast.error('Google provider is not enabled in Firebase Console Authentication.')
      } else {
        toast.error(err?.message || 'Google authentication failed.')
      }
    } finally {
      setIsAuthenticating(false)
    }
  }

  const isLoading = isAuthenticating || googleMutation.isPending

  return (
    <button
      type="button"
      onClick={handleGoogleClick}
      disabled={isLoading}
      className="w-full py-3 px-4 rounded-xl border border-[var(--color-outline-variant)] bg-white hover:bg-gray-50 flex items-center justify-center gap-3 text-sm font-semibold text-[var(--color-on-surface)] transition-all shadow-sm hover:shadow active:scale-[0.99] disabled:opacity-60 cursor-pointer"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
          <span>Signing in with Google...</span>
        </>
      ) : (
        <>
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{mode === 'signup' ? 'Sign up with Google' : 'Continue with Google'}</span>
        </>
      )}
    </button>
  )
}
