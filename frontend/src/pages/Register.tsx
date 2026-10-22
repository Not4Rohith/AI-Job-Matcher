import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/api/endpoints'
import { useAuthStore } from '@/store/authStore'
import { Sparkles, Eye, EyeOff, CheckCircle, ArrowRight, Loader2, Mail, User } from 'lucide-react'
import toast from 'react-hot-toast'

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName:  z.string().min(1, 'Last name is required'),
  email:     z.string().email('Please enter a valid email address'),
  password:  z.string().min(1, 'Password is required'),
  consentGiven: z.boolean().refine(v => v, 'You must agree to continue'),
})
type FormData = z.infer<typeof schema>

export default function Register() {
  const navigate = useNavigate()
  const { setAuth, clearAuth } = useAuthStore()
  const [showPw, setShowPw] = useState(false)

  // Clear any dangling stale sessions when arriving at Register
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('clear') === 'true') {
      clearAuth()
      toast.success('Session reset')
    }
  }, [clearAuth])

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { consentGiven: false },
  })

  // Email/password registration mutation
  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken)
      toast.success('Account created! Let’s set up your profile.')
      navigate('/onboarding')
    },
    onError: (err: any) => {
      const data = err?.response?.data
      if (data?.errors && typeof data.errors === 'object') {
        const errorList = Object.entries(data.errors)
          .map(([field, msg]) => `${field}: ${msg}`)
          .join('\n')
        toast.error(errorList || data.detail || 'Validation failed')
      } else if (data?.detail) {
        toast.error(data.detail)
      } else {
        toast.error('Registration failed. Please check your connection or try again.')
      }
    },
  })

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-background)' }}>
      {/* Left branding panel */}
      <div 
        className="hidden lg:flex flex-1 flex-col justify-between p-16 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, var(--color-primary) 0%, var(--color-primary-container) 100%)' }}
      >
        <div className="absolute inset-0 opacity-10"
             style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-white font-bold text-2xl tracking-tight">HireMatch AI</span>
          </div>
        </div>

        <div className="relative z-10 space-y-6 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-white/90 text-xs font-semibold backdrop-blur-sm">
            <span>🚀 Accelerate Your Career</span>
          </div>
          <h2 className="text-white font-bold text-4xl leading-tight tracking-tight">
            Start your smarter job search in 3 simple steps
          </h2>
          <p className="text-white/80 text-base leading-relaxed">
            Whether you are a student seeking internships or an experienced graduate looking for top-tier roles, HireMatch AI adapts to your unique journey.
          </p>
          <div className="space-y-3 pt-2">
            {[
              '1. Tailored onboarding for Students & Graduates',
              '2. Build or upload an ATS-friendly resume',
              '3. AI semantic job matching with zero fluff',
            ].map(item => (
              <div key={item} className="flex items-center gap-3 text-white/90 text-sm">
                <CheckCircle className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-white/60 text-xs">
          © 2026 HireMatch AI · DPDP & GDPR Compliant
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-md space-y-6">
          
          {/* Mobile Header */}
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--color-primary)] text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-bold text-lg" style={{ color: 'var(--color-on-surface)' }}>HireMatch AI</span>
          </div>

          {/* Tab switcher: Login / Register */}
          <div className="flex p-1 rounded-xl bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)]">
            <Link 
              to="/login" 
              className="flex-1 py-2 text-xs font-semibold text-center rounded-lg transition-all text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]"
            >
              Sign In
            </Link>
            <button 
              type="button" 
              className="flex-1 py-2 text-xs font-semibold rounded-lg transition-all bg-white text-[var(--color-primary)] shadow-sm"
            >
              Create Account
            </button>
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-on-surface)' }}>
              Create your account
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--color-on-surface-variant)' }}>
              Get started free and complete your personalized profile
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit((d) => registerMutation.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-on-surface)' }}>
                  First Name
                </label>
                <div className="relative">
                  <input {...register('firstName')} className="input pl-8" placeholder="Alex" />
                  <User className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
                {errors.firstName && <p className="text-xs mt-1 text-red-600">{errors.firstName.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-on-surface)' }}>
                  Last Name
                </label>
                <input {...register('lastName')} className="input" placeholder="Johnson" />
                {errors.lastName && <p className="text-xs mt-1 text-red-600">{errors.lastName.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-on-surface)' }}>
                Email Address
              </label>
              <div className="relative">
                <input {...register('email')} type="email" className="input pl-9" placeholder="alex@example.com" />
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              {errors.email && <p className="text-xs mt-1 text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-on-surface)' }}>
                Password
              </label>
              <div className="relative">
                <input 
                  {...register('password')} 
                  type={showPw ? 'text' : 'password'} 
                  className="input pr-10" 
                  placeholder="Enter your password" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs mt-1 text-red-600">{errors.password.message}</p>}
            </div>

            <div className="flex items-start gap-2.5 pt-1">
              <input 
                {...register('consentGiven')} 
                type="checkbox" 
                id="consent" 
                className="mt-1 w-4 h-4 rounded accent-indigo-600" 
              />
              <label htmlFor="consent" className="text-xs leading-relaxed text-gray-600">
                I agree to the <span className="text-[var(--color-primary)] font-medium underline">Terms of Service</span> and consent to data processing for job matching (DPDP & GDPR compliant).
              </label>
            </div>
            {errors.consentGiven && <p className="text-xs text-red-600">{errors.consentGiven.message}</p>}

            <button 
              type="submit" 
              disabled={registerMutation.isPending}
              className="btn-primary w-full py-3 mt-2 text-sm shadow-md disabled:opacity-60"
            >
              {registerMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Creating Account...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Create Account & Next <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-[var(--color-on-surface-variant)]">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-[var(--color-primary)] hover:underline">
              Sign In
            </Link>
          </p>

        </div>
      </div>
    </div>
  )
}
