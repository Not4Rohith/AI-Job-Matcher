import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/api/endpoints'
import { useAuthStore } from '@/store/authStore'
import { Sparkles, Eye, EyeOff, CheckCircle, ArrowRight, Loader2, Mail } from 'lucide-react'
import toast from 'react-hot-toast'

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})
type FormData = z.infer<typeof schema>

export default function Login() {
  const navigate = useNavigate()
  const { setAuth, clearAuth } = useAuthStore()
  const [showPw, setShowPw] = useState(false)

  // Clear any dangling stale sessions when arriving at Login
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('clear') === 'true') {
      clearAuth()
      toast.success('Session cleared')
    }
  }, [clearAuth])

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  // Email/password login
  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken)
      toast.success('Welcome back!')
      navigate('/profile')
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Invalid email or password')
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
            <span>✨ AI-Powered Career Platform</span>
          </div>
          <h2 className="text-white font-bold text-4xl leading-tight tracking-tight">
            Welcome back to your smart career copilot
          </h2>
          <p className="text-white/80 text-base leading-relaxed">
            Instantly match with curated jobs, track your interview pipeline, and leverage generative AI to elevate your resume.
          </p>
          <div className="space-y-3 pt-2">
            {[
              'Direct semantic job matching tailored to your profile',
              'Instant skill gap insights with learning resources',
              'ATS-optimized resume builder & analyzer',
            ].map(item => (
              <div key={item} className="flex items-center gap-3 text-white/90 text-sm">
                <CheckCircle className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-white/60 text-xs">
          © 2026 HireMatch AI. All rights reserved.
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          
          {/* Mobile Header */}
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--color-primary)] text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-bold text-lg" style={{ color: 'var(--color-on-surface)' }}>HireMatch AI</span>
          </div>

          {/* Tab switcher: Login / Register */}
          <div className="flex p-1 rounded-xl bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)]">
            <button 
              type="button" 
              className="flex-1 py-2 text-xs font-semibold rounded-lg transition-all bg-white text-[var(--color-primary)] shadow-sm"
            >
              Sign In
            </button>
            <Link 
              to="/register" 
              className="flex-1 py-2 text-xs font-semibold text-center rounded-lg transition-all text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]"
            >
              Create Account
            </Link>
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-on-surface)' }}>
              Sign in to your account
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--color-on-surface-variant)' }}>
              Enter your email and password to continue
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit((d) => loginMutation.mutate(d))} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-on-surface)' }}>
                Email Address
              </label>
              <div className="relative">
                <input 
                  {...register('email')} 
                  type="email" 
                  className="input pl-9" 
                  placeholder="name@company.com" 
                  autoFocus 
                />
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              {errors.email && <p className="text-xs mt-1 text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold" style={{ color: 'var(--color-on-surface)' }}>
                  Password
                </label>
                <button type="button" className="text-xs font-medium text-[var(--color-primary)] hover:underline">
                  Forgot?
                </button>
              </div>
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

            <button 
              type="submit" 
              disabled={loginMutation.isPending}
              className="btn-primary w-full py-3 mt-2 text-sm shadow-md disabled:opacity-60"
            >
              {loginMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign In <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-[var(--color-on-surface-variant)]">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-semibold text-[var(--color-primary)] hover:underline">
              Create an account
            </Link>
          </p>

        </div>
      </div>
    </div>
  )
}
