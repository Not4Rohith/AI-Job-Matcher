import { Link } from 'react-router-dom'
import { Sparkles, Target, Zap, Shield, TrendingUp, CheckCircle, Star, ArrowRight, Brain } from 'lucide-react'

const STATS = [
  { value: '94%', label: 'Average Match Accuracy' },
  { value: '3.2×', label: 'Faster Shortlisting' },
  { value: '50K+', label: 'Jobs Indexed Daily' },
  { value: '12K+', label: 'Candidates Placed' },
]

const FEATURES = [
  {
    icon: Brain,
    title: 'Semantic AI Matching',
    desc: 'Our NLP engine understands context—not just keywords—giving you matches that actually fit.',
    color: '#4f46e5',
    bg: '#e5eeff',
  },
  {
    icon: Target,
    title: 'Skill Gap Analysis',
    desc: "See exactly what you're missing for each role, with curated learning paths to close the gap.",
    color: '#006b5f',
    bg: '#6df5e1',
  },
  {
    icon: Zap,
    title: 'Resume Enhancement',
    desc: 'AI tailors your resume per job—strong verbs, JD keywords, ATS optimization—without inventing experience.',
    color: '#005338',
    bg: '#6ffbbe',
  },
  {
    icon: Shield,
    title: 'Privacy First',
    desc: 'DPDP/GDPR compliant. Your data is encrypted, you control it, and you can delete it anytime.',
    color: '#3525cd',
    bg: '#e2dfff',
  },
  {
    icon: TrendingUp,
    title: 'Application Tracker',
    desc: 'Kanban pipeline, status timelines, smart reminders—never lose track of an opportunity.',
    color: '#006b5f',
    bg: '#e5eeff',
  },
  {
    icon: CheckCircle,
    title: 'Assisted Apply',
    desc: 'Human-in-the-loop apply flow with AI cover letters, editable at every step—no blind submissions.',
    color: '#4f46e5',
    bg: '#e2dfff',
  },
]

const TESTIMONIALS = [
  {
    name: 'Anika Sharma',
    role: 'Software Engineer → Senior SDE',
    quote: 'HireMatch found me a role that was 91% aligned with my background. The skill gap report told me exactly what to work on.',
    rating: 5,
  },
  {
    name: 'Rohan Mehta',
    role: 'Product Manager',
    quote: 'The resume tailoring is incredible. My ATS score went from 54 to 87 for the same resume—just smarter targeting.',
    rating: 5,
  },
  {
    name: 'Priya Nair',
    role: 'Data Scientist',
    quote: 'The kanban tracker and automated follow-up reminders kept me organized across 20+ applications simultaneously.',
    rating: 5,
  },
]

export default function Landing() {
  return (
    <div className="min-h-screen scroll-smooth" style={{ background: 'var(--color-background)', fontFamily: 'Inter, sans-serif' }}>
      {/* ── Navbar ─────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 h-16 backdrop-blur-sm"
           style={{ background: 'rgba(248,249,255,0.92)', borderBottom: '1px solid var(--color-outline-variant)' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, #3525cd 0%, #4f46e5 100%)' }}>
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-base" style={{ color: 'var(--color-on-surface)' }}>
            HireMatch<span style={{ color: 'var(--color-primary)' }}> AI</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="btn-secondary text-sm px-4 py-2">Sign In</Link>
          <Link to="/register" className="btn-primary text-sm px-4 py-2">Get Started Free</Link>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="pt-32 pb-20 px-8 text-center relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl"
               style={{ background: 'radial-gradient(circle, #4f46e5 0%, transparent 70%)' }} />
          <div className="absolute bottom-10 right-1/4 w-72 h-72 rounded-full opacity-15 blur-3xl"
               style={{ background: 'radial-gradient(circle, #6df5e1 0%, transparent 70%)' }} />
        </div>

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
               style={{ background: 'var(--color-surface-container)', color: 'var(--color-primary)', border: '1px solid var(--color-outline-variant)' }}>
            <Sparkles className="w-3.5 h-3.5" />
            Powered by Semantic NLP + pgvector
          </div>

          <h1 className="font-bold mb-6 leading-tight"
              style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', letterSpacing: '-0.02em', color: 'var(--color-on-surface)' }}>
            Land Your Dream Job with{' '}
            <span style={{
              background: 'linear-gradient(135deg, #3525cd 0%, #4f46e5 50%, #006b5f 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              AI-Powered Matching
            </span>
          </h1>

          <p className="text-lg mb-10 max-w-2xl mx-auto" style={{ color: 'var(--color-on-surface-variant)', lineHeight: '1.75' }}>
            HireMatch uses semantic embeddings to find roles where you're genuinely a strong fit—then helps you apply with a tailored resume, AI cover letter, and smart follow-up reminders.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link to="/register" className="btn-primary px-6 py-3 text-base gap-2">
              Start Matching Free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/login" className="btn-secondary px-6 py-3 text-base">
              Sign In
            </Link>
          </div>

          {/* Trust signals */}
          <p className="text-xs mt-6" style={{ color: 'var(--color-outline)' }}>
            No credit card · GDPR compliant · Delete your data anytime
          </p>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────── */}
      <section className="py-16 px-8" style={{ background: 'var(--color-surface-container-low)' }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-4xl font-bold mb-1" style={{ color: 'var(--color-primary)', letterSpacing: '-0.02em' }}>
                {s.value}
              </div>
              <div className="text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────── */}
      <section className="py-20 px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-semibold mb-4" style={{ color: 'var(--color-on-surface)', letterSpacing: '-0.015em' }}>
              Everything you need to win
            </h2>
            <p style={{ color: 'var(--color-on-surface-variant)' }}>
              From discovery to offer—HireMatch has your back at every step.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => {
              const Icon = f.icon
              return (
                <div key={f.title} className="card p-6 group hover:elevation-2 transition-all duration-200">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                       style={{ background: f.bg }}>
                    <Icon className="w-5 h-5" style={{ color: f.color }} />
                  </div>
                  <h3 className="font-semibold text-base mb-2" style={{ color: 'var(--color-on-surface)' }}>{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-on-surface-variant)' }}>{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────── */}
      <section className="py-20 px-8" style={{ background: 'var(--color-surface-container-low)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-semibold mb-12" style={{ color: 'var(--color-on-surface)', letterSpacing: '-0.015em' }}>
            Three steps to your next role
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Upload or Build', desc: 'Upload your resume or use our guided builder. AI parses and structures it instantly.' },
              { step: '02', title: 'Get Matched', desc: 'Semantic embeddings find the best-fit roles from 50K+ live jobs. See your exact match score breakdown.' },
              { step: '03', title: 'Apply Confidently', desc: 'AI tailors your resume, writes a cover letter, and tracks every application—you stay in control.' },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="text-5xl font-bold mb-4 opacity-15" style={{ color: 'var(--color-primary)' }}>{item.step}</div>
                <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--color-on-surface)' }}>{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-on-surface-variant)' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────── */}
      <section className="py-20 px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-semibold text-center mb-12" style={{ color: 'var(--color-on-surface)', letterSpacing: '-0.015em' }}>
            What candidates say
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="card p-6">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" style={{ color: '#f59e0b' }} />
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-4 italic" style={{ color: 'var(--color-on-surface)' }}>
                  "{t.quote}"
                </p>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-on-surface)' }}>{t.name}</p>
                  <p className="text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="py-20 px-8 text-center" style={{ background: 'var(--color-surface-container)' }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--color-on-surface)', letterSpacing: '-0.02em' }}>
            Ready to match smarter?
          </h2>
          <p className="mb-8" style={{ color: 'var(--color-on-surface-variant)' }}>
            Join thousands of candidates finding roles they actually love.
          </p>
          <Link to="/register" className="btn-primary px-8 py-3 text-base">
            Create Free Account <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="py-8 px-8 text-center border-t" style={{ borderColor: 'var(--color-outline-variant)' }}>
        <p className="text-sm" style={{ color: 'var(--color-outline)' }}>
          © 2026 HireMatch AI · Privacy Policy · Terms of Service
        </p>
      </footer>
    </div>
  )
}
