import { useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FileText, Upload, Plus, CheckCircle, Clock, MoreVertical, Loader2 } from 'lucide-react'
import { resumeApi } from '@/api/endpoints'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import ResumeBuilderModal from '@/components/resume/ResumeBuilderModal'

export default function ResumeHub() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showBuilder, setShowBuilder] = useState(false)
  
  const { data: resumes, isLoading } = useQuery({
    queryKey: ['resumes'],
    queryFn: resumeApi.list,
  })

  const uploadMutation = useMutation({
    mutationFn: resumeApi.upload,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] })
      toast.success('Resume uploaded and analyzed successfully!')
      if (fileInputRef.current) fileInputRef.current.value = ''
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Resume upload failed. Please try again.')
      if (fileInputRef.current) fileInputRef.current.value = ''
    },
  })

  const setPrimaryMutation = useMutation({
    mutationFn: resumeApi.setPrimary,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] })
      toast.success('Primary resume updated!')
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Failed to update primary resume.')
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const formData = new FormData()
      formData.append('file', file)
      uploadMutation.mutate(formData)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1" style={{ color: 'var(--color-on-surface)', letterSpacing: '-0.01em' }}>Resume Hub</h1>
        <p className="text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Manage your resume versions and AI-tailored copies</p>
      </div>

      {/* Upload + Builder actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <label className={`card p-6 flex flex-col items-center justify-center gap-3 cursor-pointer border-2 border-dashed transition-all hover:elevation-2 ${uploadMutation.isPending ? 'opacity-50 pointer-events-none' : ''}`}
               style={{ borderColor: 'var(--color-primary)', background: 'var(--color-surface-container-low)' }}>
          <input 
            type="file" 
            accept=".pdf,.docx" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <div className="w-12 h-12 rounded-xl flex items-center justify-center"
               style={{ background: 'var(--color-surface-container)' }}>
            {uploadMutation.isPending ? (
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--color-primary)' }} />
            ) : (
              <Upload className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
            )}
          </div>
          <div className="text-center">
            <p className="font-semibold text-sm mb-1" style={{ color: 'var(--color-on-surface)' }}>
              {uploadMutation.isPending ? 'Uploading & Analyzing...' : 'Upload Resume'}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>PDF or DOCX · Max 5MB</p>
          </div>
        </label>

        <button 
          onClick={() => setShowBuilder(true)}
          className="card p-6 flex flex-col items-center justify-center gap-3 transition-all hover:elevation-2"
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center"
               style={{ background: 'var(--color-surface-container)' }}>
            <Plus className="w-6 h-6" style={{ color: 'var(--color-secondary)' }} />
          </div>
          <div className="text-center">
            <p className="font-semibold text-sm mb-1" style={{ color: 'var(--color-on-surface)' }}>Resume Builder</p>
            <p className="text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>Step-by-step wizard · 3 templates · PDF export</p>
          </div>
        </button>
      </div>

      {/* Resume versions */}
      <div>
        <h2 className="font-semibold mb-3" style={{ color: 'var(--color-on-surface)' }}>Your Resumes</h2>
        
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : !resumes || resumes.length === 0 ? (
          <div className="card p-8 text-center text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
            No resumes uploaded yet.
          </div>
        ) : (
          <div className="space-y-3">
            {resumes.map((r: any) => (
              <div key={r.id} className="card p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                     style={{ background: 'var(--color-surface-container)' }}>
                  <FileText className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--color-on-surface)' }}>{r.fileName}</p>
                    {r.isPrimary && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: 'var(--color-surface-container)', color: 'var(--color-primary)' }}>
                        Primary
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3 text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(r.createdAt), 'MMM d, yyyy')}
                    </span>
                    {r.atsScore && (
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />ATS: {r.atsScore}%
                      </span>
                    )}
                    <span style={{ color: 'var(--color-outline)' }}>{r.source}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!r.isPrimary && (
                    <button 
                      onClick={() => setPrimaryMutation.mutate(r.id)}
                      className="text-xs font-medium px-3 py-1 rounded hover:bg-gray-100"
                      style={{ color: 'var(--color-primary)' }}
                      disabled={setPrimaryMutation.isPending}
                    >
                      Set Primary
                    </button>
                  )}
                  <button className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100">
                    <MoreVertical className="w-4 h-4" style={{ color: 'var(--color-outline)' }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ResumeBuilderModal 
        isOpen={showBuilder}
        onClose={() => setShowBuilder(false)}
      />
    </div>
  )
}
