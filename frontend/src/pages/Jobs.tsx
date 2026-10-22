import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, MapPin, Clock, Filter, Briefcase, TrendingUp, X, Sparkles, ExternalLink, ChevronDown, SlidersHorizontal, RotateCcw } from 'lucide-react'
import { jobApi } from '@/api/endpoints'

const WORK_MODES = ['All', 'Remote', 'Hybrid', 'Onsite']
const JOB_TYPES  = ['All', 'Full-time', 'Contract', 'Internship']

export default function Jobs() {
  const [query, setQuery] = useState('')
  const [workMode, setWorkMode] = useState('All')
  const [jobType, setJobType] = useState('All')
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  const { data: recommendations = [], refetch, isFetching } = useQuery({
    queryKey: ['job-recommendations'],
    queryFn: () => jobApi.recommendations(100),
  })

  // Format real jobs to match frontend expectations
  const mappedJobs = recommendations.map((rec: any) => ({
    id: rec.job.id,
    title: rec.job.title,
    company: rec.job.company,
    location: rec.job.location || 'Remote',
    workMode: rec.job.workMode || 'REMOTE',
    score: Math.round(rec.overallScore || 85),
    type: (rec.job.jobType || 'FULL_TIME').replace('_', '-').toLowerCase(),
    displayType: (rec.job.jobType || 'FULL_TIME').replace('_', ' '),
    applyUrl: rec.job.applyUrl,
    skills: (rec.job.description || '')
      .split('\n')[0]
      .replace('Skills & Tags:', '')
      .split(',')
      .slice(0, 4)
      .map((s: string) => s.trim())
      .filter(Boolean),
    salary: rec.job.salaryMin ? `$${Math.round(rec.job.salaryMin / 1000)}k–$${Math.round(rec.job.salaryMax / 1000)}k` : 'Market Competitive',
    posted: 'Live'
  }))

  const filtered = mappedJobs.filter((j: any) => {
    const q = query.toLowerCase()
    const matchQ = !q || j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q) || j.skills.some((s: string) => s.toLowerCase().includes(q))
    const matchMode = workMode === 'All' || j.workMode.toUpperCase().includes(workMode.toUpperCase()) || j.location.toLowerCase().includes(workMode.toLowerCase())
    const matchType = jobType === 'All' || j.displayType.toLowerCase().includes(jobType.toLowerCase())
    return matchQ && matchMode && matchType
  })

  const activeFilterCount = (workMode !== 'All' ? 1 : 0) + (jobType !== 'All' ? 1 : 0)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold mb-1" style={{ color: 'var(--color-on-surface)', letterSpacing: '-0.01em' }}>Live Tech Job Search</h1>
          <p className="text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
            {mappedJobs.length} live opportunities synchronized · Real-time filtering
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live APIs Connected</span>
          </div>
          <button 
            onClick={() => refetch()} 
            className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors"
            title="Refresh jobs"
          >
            <Sparkles className={`w-4 h-4 ${isFetching ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── Search + collapsible dropdown filters ─────────────────── */}
      <div className="card p-4 space-y-3">
        <div className="flex gap-2.5 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-outline)' }} />
            <input
              className="input pl-9 w-full"
              placeholder="Search by title, company, or skill…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-75">
                <X className="w-4 h-4" style={{ color: 'var(--color-outline)' }} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg border text-xs font-semibold transition-all shrink-0 ${
              isFiltersOpen || activeFilterCount > 0
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-xs'
                : 'border-gray-200 bg-white hover:bg-gray-50 text-[var(--color-on-surface)]'
            }`}
            title="Toggle filter dropdown"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                isFiltersOpen || activeFilterCount > 0 ? 'bg-white text-[var(--color-primary)]' : 'bg-[var(--color-primary)] text-white'
              }`}>
                {activeFilterCount}
              </span>
            )}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isFiltersOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Active filter chips (when filters collapsed) */}
        {activeFilterCount > 0 && !isFiltersOpen && (
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <span className="text-xs text-[var(--color-on-surface-variant)] font-medium">Applied:</span>
            {workMode !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                Mode: {workMode}
                <button type="button" onClick={() => setWorkMode('All')} className="hover:text-red-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {jobType !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                Type: {jobType}
                <button type="button" onClick={() => setJobType('All')} className="hover:text-red-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={() => { setWorkMode('All'); setJobType('All'); }}
              className="text-xs text-[var(--color-primary)] font-medium hover:underline ml-1"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Hidden dropdown filter menu revealed on click */}
        {isFiltersOpen && (
          <div className="pt-3 border-t border-[var(--color-outline-variant)] grid sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--color-on-surface)] flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                <span>Work Mode</span>
              </label>
              <div className="relative">
                <select
                  value={workMode}
                  onChange={e => setWorkMode(e.target.value)}
                  className="input text-xs w-full appearance-none pr-8 cursor-pointer font-medium"
                >
                  {WORK_MODES.map(m => (
                    <option key={m} value={m}>{m === 'All' ? 'All Work Modes' : m}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-400" />
              </div>
              <div className="flex gap-1.5 flex-wrap pt-1">
                {WORK_MODES.map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setWorkMode(m)}
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                      workMode === m
                        ? 'bg-[var(--color-primary)] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--color-on-surface)] flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                <span>Job Type</span>
              </label>
              <div className="relative">
                <select
                  value={jobType}
                  onChange={e => setJobType(e.target.value)}
                  className="input text-xs w-full appearance-none pr-8 cursor-pointer font-medium"
                >
                  {JOB_TYPES.map(t => (
                    <option key={t} value={t}>{t === 'All' ? 'All Job Types' : t}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-400" />
              </div>
              <div className="flex gap-1.5 flex-wrap pt-1">
                {JOB_TYPES.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setJobType(t)}
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                      jobType === t
                        ? 'bg-[var(--color-primary)] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Dropdown footer actions */}
            <div className="sm:col-span-2 flex items-center justify-between pt-2 border-t border-gray-100">
              <span className="text-xs text-[var(--color-on-surface-variant)]">
                Showing {filtered.length} matching jobs
              </span>
              <div className="flex items-center gap-3">
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={() => { setWorkMode('All'); setJobType('All'); }}
                    className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1 hover:underline"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsFiltersOpen(false)}
                  className="btn-primary text-xs py-1 px-3"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Results ──────────────────────────────────────────── */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="card p-12 text-center space-y-3">
            <Briefcase className="w-10 h-10 mx-auto opacity-50" style={{ color: 'var(--color-primary)' }} />
            <p className="font-semibold text-base" style={{ color: 'var(--color-on-surface)' }}>No jobs found</p>
            <p className="text-xs max-w-sm mx-auto" style={{ color: 'var(--color-on-surface-variant)' }}>
              No live jobs are loaded matching your criteria, or the database needs job seeding.
            </p>
            <div className="pt-2 flex justify-center">
              <button
                onClick={() => { setQuery(''); setWorkMode('All'); setJobType('All') }}
                className="btn-secondary gap-2 text-xs py-2 px-4"
              >
                Reset Search Filters
              </button>
            </div>
          </div>
        )}
        {filtered.map((job: any) => (
          <Link key={job.id} to={`/jobs/${job.id}`}
                className="card p-5 flex gap-5 items-start group hover:elevation-2 transition-all duration-200 block">
            {/* Company avatar */}
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm"
                 style={{ background: 'var(--color-surface-container)', color: 'var(--color-primary)' }}>
              {job.company[0]}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-base group-hover:text-[var(--color-primary)] transition-colors"
                      style={{ color: 'var(--color-on-surface)' }}>
                    {job.title}
                  </h3>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--color-on-surface-variant)' }}>{job.company}</p>
                </div>
                {/* Match badge */}
                <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                     style={{
                       background: job.score >= 80 ? '#ecfdf5' : job.score >= 65 ? '#fef3c7' : '#fef2f2',
                       color: job.score >= 80 ? '#065f46' : job.score >= 65 ? '#92400e' : '#991b1b',
                     }}>
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span className="text-xs font-semibold">{job.score}% match</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mt-2 text-xs" style={{ color: 'var(--color-outline)' }}>
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
                <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{job.type}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{job.posted}</span>
                <span className="font-medium" style={{ color: 'var(--color-on-surface-variant)' }}>{job.salary}</span>
              </div>

              <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100 flex-wrap gap-2">
                <div className="flex gap-1.5 flex-wrap">
                  {job.skills.map((s: string) => (
                    <span key={s} className="skill-matched text-xs px-2 py-0.5 rounded-full">{s}</span>
                  ))}
                </div>
                {job.applyUrl && (
                  <a
                    href={job.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1 transition-all shadow-2xs hover:shadow-xs shrink-0"
                  >
                    <span>Apply on Site</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
