import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm as useHookForm } from 'react-hook-form'
import { profileApi } from '@/api/endpoints'
import { User, MapPin, Briefcase, IndianRupee, Clock, Loader2, Link as LinkIcon, AlertTriangle } from 'lucide-react'
import { useEffect } from 'react'
import toast from 'react-hot-toast'

export default function Settings() {
  const queryClient = useQueryClient()
  
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.get
  })

  const { register, handleSubmit, reset } = useHookForm()

  useEffect(() => {
    if (profile) {
      reset(profile)
    }
  }, [profile, reset])

  const updateMutation = useMutation({
    mutationFn: profileApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast.success('Settings updated successfully')
    },
    onError: () => {
      toast.error('Failed to update settings')
    }
  })

  const onSubmit = (data: any) => {
    updateMutation.mutate(data)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-on-surface)', letterSpacing: '-0.01em' }}>Settings</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl"
               style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-container) 100%)', color: '#fff' }}>
            {profile?.firstName?.[0]}{profile?.lastName?.[0]}
          </div>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-on-surface)' }}>{profile?.firstName} {profile?.lastName}</h2>
            <p className="text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>{profile?.email}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-on-surface-variant)' }}>First Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-outline)' }} />
              <input {...register('firstName')} className="input pl-9 w-full" placeholder="First Name" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-on-surface-variant)' }}>Last Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-outline)' }} />
              <input {...register('lastName')} className="input pl-9 w-full" placeholder="Last Name" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-on-surface-variant)' }}>Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-outline)' }} />
              <input {...register('location')} className="input pl-9 w-full" placeholder="City, Country" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-on-surface-variant)' }}>Work Mode</label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-outline)' }} />
              <select {...register('preferredWorkMode')} className="input pl-9 w-full">
                <option value="">Select Mode</option>
                <option value="REMOTE">Remote</option>
                <option value="HYBRID">Hybrid</option>
                <option value="ONSITE">Onsite</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-on-surface-variant)' }}>Expected CTC</label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-outline)' }} />
              <input {...register('expectedCtc')} type="number" step="0.01" className="input pl-9 w-full" placeholder="e.g. 1500000" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-on-surface-variant)' }}>Notice Period (Days)</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-outline)' }} />
              <input {...register('noticePeriodDays')} type="number" className="input pl-9 w-full" placeholder="e.g. 30" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-on-surface-variant)' }}>LinkedIn</label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-outline)' }} />
              <input {...register('linkedinUrl')} className="input pl-9 w-full" placeholder="https://linkedin.com/in/..." />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-on-surface-variant)' }}>GitHub</label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-outline)' }} />
              <input {...register('githubUrl')} className="input pl-9 w-full" placeholder="https://github.com/..." />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-on-surface-variant)' }}>Bio</label>
            <textarea {...register('bio')} className="input w-full min-h-[100px]" placeholder="Tell us about yourself..." />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button type="submit" disabled={updateMutation.isPending} className="btn-primary px-6 flex items-center gap-2">
            {updateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Changes
          </button>
        </div>
      </form>

      {/* Danger zone */}
      <div className="card p-5 border" style={{ borderColor: 'var(--color-error)', background: '#fff5f5' }}>
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-5 h-5" style={{ color: 'var(--color-error)' }} />
          <h3 className="font-semibold text-sm" style={{ color: 'var(--color-error)' }}>Danger Zone</h3>
        </div>
        <p className="text-xs mb-3" style={{ color: 'var(--color-on-surface-variant)' }}>
          Delete your account and all data permanently. This cannot be undone.
        </p>
        <button className="text-sm font-medium px-4 py-2 rounded-lg border transition-colors hover:bg-red-50"
                style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}>
          Delete Account
        </button>
      </div>
    </div>
  )
}
