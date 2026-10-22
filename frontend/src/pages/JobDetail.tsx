import { useParams, Link } from 'react-router-dom'
import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { MapPin, Clock, Briefcase, ExternalLink, Sparkles, CheckCircle, XCircle, ArrowLeft, TrendingUp, BookOpen, Loader2 } from 'lucide-react'
import { jobApi, matchApi, enhancementApi, applicationApi } from '@/api/endpoints'

function ScoreBar({ label, score }: { label: string; score: number }) {
  const color = score >= 85 ? '#10b981' : score >= 70 ? '#f59e0b' : '#ef4444'
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--color-on-surface-variant)' }}>
        <span>{label}</span>
        <span className="font-semibold" style={{ color }}>{score.toFixed(0)}%</span>
      </div>
      <div className="h-2 rounded-full" style={{ background: 'var(--color-surface-container)' }}>
        <div className="h-full rounded-full transition-all duration-700"
             style={{ width: `${score}%`, background: color }} />
      </div>
    </div>
  )
}

export default function JobDetail() {
  const { id } = useParams()
  const [enhancedData, setEnhancedData] = useState<any>(null)

  const { data: job, isLoading: isJobLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: () => jobApi.getById(Number(id)),
    enabled: !!id
  })

  const { data: match, isLoading: isMatchLoading } = useQuery({
    queryKey: ['match', id],
    queryFn: () => matchApi.getMatch(Number(id)),
    enabled: !!id
  })

  const { mutate: tailorResume, isPending: isTailoring } = useMutation({
    mutationFn: () => enhancementApi.enhance(Number(id)),
    onSuccess: (data) => setEnhancedData(data)
  })

  if (isJobLoading || isMatchLoading) {
    return <div className="text-center py-20">Loading AI Analysis...</div>
  }

  if (!job) {
    return <div className="text-center py-20">Job not found</div>
  }

  const missing = match?.missingSkills?.map((s: string) => ({
    skill: s,
    importance: 'must-have',
    reason: 'Identified as a gap based on your current resume.',
    suggestion: 'Consider adding ' + s + ' to your skillset.'
  })) || []

  const { mutate: saveToTracker, isPending: isSaving } = useMutation({
    mutationFn: () => applicationApi.create({ jobId: Number(id), status: 'SAVED' }),
    onSuccess: () => alert('Job saved to tracker successfully!')
  })

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Back */}
      <Link to="/jobs" className="inline-flex items-center gap-2 text-sm transition-colors"
            style={{ color: 'var(--color-on-surface-variant)' }}>
        <ArrowLeft className="w-4 h-4" /> Back to search
      </Link>

      {enhancedData && (
        <div className="card p-6 mb-6 border-l-4" style={{ borderColor: 'var(--color-primary)', background: 'var(--color-surface-container-lowest)' }}>
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-on-surface)' }}>AI Tailored Resume Ready!</h2>
          </div>
          <p className="text-sm mb-4" style={{ color: 'var(--color-on-surface-variant)' }}>
            Your ATS score improved from <strong>{enhancedData.ats_score_before}%</strong> to <strong>{enhancedData.ats_score_after}%</strong>.
            We successfully optimized {enhancedData.changes?.length || 0} sections of your resume.
          </p>
          <button className="btn-primary" onClick={() => alert("Downloading PDF... (Placeholder for Export)")}>
            Download Enhanced PDF
          </button>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ── Main column ──────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Job header card */}
          <div className="card p-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center font-bold text-lg shrink-0"
                   style={{ background: 'var(--color-surface-container)', color: 'var(--color-primary)' }}>
                {job.company?.[0] || 'C'}
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-semibold mb-1" style={{ color: 'var(--color-on-surface)', letterSpacing: '-0.01em' }}>{job.title}</h1>
                <p className="font-medium mb-3" style={{ color: 'var(--color-on-surface-variant)' }}>{job.company}</p>
                <div className="flex flex-wrap gap-3 text-xs" style={{ color: 'var(--color-outline)' }}>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location || 'Remote'}</span>
                  <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{job.jobType || 'Full-time'}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{job.experienceMin ? `${job.experienceMin}+ yrs` : 'Entry Level'}</span>
                  <span className="font-medium" style={{ color: 'var(--color-on-surface-variant)' }}>
                    {job.salaryMin && job.salaryMin > 0 ? `$${job.salaryMin} - $${job.salaryMax}` : 'Competitive'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <a href={job.applyUrl || '#'} target="_blank" rel="noreferrer" className="btn-primary gap-2 flex-1 justify-center">
                <ExternalLink className="w-4 h-4" /> Apply Now
              </a>
              <button 
                onClick={() => tailorResume()} 
                disabled={isTailoring}
                className="btn-ai gap-2 flex-1 justify-center"
              >
                {isTailoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {isTailoring ? 'Tailoring...' : 'Tailor Resume'}
              </button>
            </div>
          </div>

          {/* Job description */}
          <div className="card p-6">
            <h2 className="font-semibold mb-4" style={{ color: 'var(--color-on-surface)' }}>Job Description</h2>
            <div className="prose prose-sm max-w-none">
              {(job.description || '').split('\n').map((line: string, i: number) => (
                <p key={i} className="mb-2 text-sm leading-relaxed" style={{ color: line.startsWith('•') ? 'var(--color-on-surface)' : 'var(--color-on-surface-variant)' }}>
                  {line}
                </p>
              ))}
            </div>
          </div>

          {/* Skill diff — matched vs missing */}
          {match && (
            <div className="card p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-on-surface)' }}>
                <Sparkles className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                Skills Analysis
              </h2>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {/* Matched */}
                <div>
                  <p className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color: '#065f46' }}>
                    <CheckCircle className="w-3.5 h-3.5" /> Matched ({match.matchedSkills?.length || 0})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {match.matchedSkills?.map((s: string) => (
                      <span key={s} className="skill-matched text-xs px-2.5 py-1 rounded-full">{s}</span>
                    ))}
                  </div>
                </div>
                {/* Missing */}
                <div>
                  <p className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color: '#991b1b' }}>
                    <XCircle className="w-3.5 h-3.5" /> Gaps ({missing.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {missing.map((m: any) => (
                      <span key={m.skill} className="skill-missing text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                        {m.skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Gap breakdown */}
              {missing.length > 0 && (
                <div className="space-y-3">
                  {missing.map((m: any) => (
                    <div key={m.skill} className="p-4 rounded-xl border" style={{ background: '#fef2f2', borderColor: '#fecaca' }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm" style={{ color: '#991b1b' }}>{m.skill}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{ background: m.importance === 'must-have' ? '#ef4444' : '#f59e0b', color: '#fff' }}>
                          {m.importance}
                        </span>
                      </div>
                      <p className="text-xs mb-2 leading-relaxed" style={{ color: '#b91c1c' }}>{m.reason}</p>
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: '#065f46' }}>
                        <BookOpen className="w-3.5 h-3.5" />
                        <span className="font-medium">Learn: </span>{m.suggestion}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Sidebar ──────────────────────────────────────────── */}
        <div className="space-y-5">
          {/* Overall score */}
          {match && (
            <>
              <div className="card p-6 text-center">
                <svg width="120" height="120" viewBox="0 0 120 120" className="mx-auto mb-3">
                  <defs>
                    <linearGradient id="gaugeG2" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#14b8a6" /><stop offset="100%" stopColor="#4f46e5" />
                    </linearGradient>
                  </defs>
                  <circle cx="60" cy="60" r="46" fill="none" stroke="#e5eeff" strokeWidth="8" />
                  <circle cx="60" cy="60" r="46" fill="none" stroke="url(#gaugeG2)" strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 46}
                    strokeDashoffset={2 * Math.PI * 46 * (1 - (match.overallScore || 0) / 100)}
                    transform="rotate(-90 60 60)" />
                  <text x="60" y="56" textAnchor="middle" style={{ fontSize: 22, fontWeight: 700, fill: '#0b1c30', fontFamily: 'Inter' }}>{match.overallScore?.toFixed(0)}%</text>
                  <text x="60" y="72" textAnchor="middle" style={{ fontSize: 10, fill: '#464555', fontFamily: 'Inter' }}>Match</text>
                </svg>
                <h3 className="font-semibold text-sm mb-2" style={{ color: 'var(--color-on-surface)' }}>Overall Compatibility</h3>
                <p className="text-xs leading-relaxed px-2" style={{ color: 'var(--color-on-surface-variant)' }}>{match.verdict || 'Good match'}</p>
              </div>

              {/* Score breakdown */}
              <div className="card p-5">
                <h3 className="font-semibold text-sm mb-4 flex items-center gap-2" style={{ color: 'var(--color-on-surface)' }}>
                  <TrendingUp className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                  Score Breakdown
                </h3>
                <div className="space-y-3">
                  <ScoreBar label="Semantic Similarity" score={match.semanticScore || 0} />
                  <ScoreBar label="Skill Overlap" score={match.skillScore || 0} />
                  <ScoreBar label="Experience Fit" score={match.experienceScore || 0} />
                </div>
              </div>
            </>
          )}

          {/* AI actions */}
          <div className="card p-5 space-y-3">
            <button className="btn-ai w-full gap-2 py-2.5">
              <Sparkles className="w-4 h-4" /> AI Cover Letter
            </button>
            <button 
              onClick={() => saveToTracker()} 
              disabled={isSaving}
              className="btn-secondary w-full gap-2 py-2.5"
            >
              <Briefcase className="w-4 h-4" /> 
              {isSaving ? 'Saving...' : 'Save to Tracker'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
