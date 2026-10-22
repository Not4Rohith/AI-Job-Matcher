import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { resumeApi } from '@/api/endpoints'
import { 
  X, Sparkles, User, GraduationCap, Briefcase, Code, Eye, 
  Plus, Trash2, CheckCircle2, ArrowRight, ArrowLeft, Loader2 
} from 'lucide-react'
import toast from 'react-hot-toast'

export interface ResumeBuilderInitialData {
  fullName?: string
  email?: string
  phone?: string
  location?: string
  degree?: string
  institution?: string
  gradYear?: string
  gpa?: string
  skills?: string[]
  targetRole?: string
  bio?: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
  initialData?: ResumeBuilderInitialData
  onSaved?: (resume: any) => void
}

export default function ResumeBuilderModal({ isOpen, onClose, initialData, onSaved }: Props) {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'basics' | 'education' | 'experience' | 'skills' | 'preview'>('basics')

  // Form states
  const [fullName, setFullName] = useState(initialData?.fullName || '')
  const [email, setEmail] = useState(initialData?.email || '')
  const [phone, setPhone] = useState(initialData?.phone || '')
  const [location, setLocation] = useState(initialData?.location || '')
  const [targetRole, setTargetRole] = useState(initialData?.targetRole || 'Software Engineer')
  const [summary, setSummary] = useState(
    initialData?.bio || 
    `Motivated and detail-oriented ${initialData?.targetRole || 'technology professional'} seeking to apply technical proficiency and problem-solving skills to build impactful, scalable solutions.`
  )

  // Education list
  const [educations, setEducations] = useState([
    {
      institution: initialData?.institution || '',
      degree: initialData?.degree || '',
      gradYear: initialData?.gradYear || '',
      gpa: initialData?.gpa || '',
    }
  ])

  // Experiences list
  const [experiences, setExperiences] = useState([
    {
      title: initialData?.targetRole ? `${initialData.targetRole} Intern` : 'Software Engineering Intern',
      company: 'Tech Solutions Inc.',
      duration: 'Summer 2024',
      description: '• Developed and tested core application features using modern frameworks.\n• Collaborated with team members to optimize database queries and boost responsiveness by 25%.\n• Built automated test suites ensuring high code quality.'
    }
  ])

  // Projects list
  const [projects, setProjects] = useState([
    {
      name: 'AI-Powered Career Platform',
      tech: 'React, TypeScript, Python, REST APIs',
      description: '• Engineered end-to-end user workflows with instant semantic search and real-time dashboard analytics.\n• Designed responsive UI components following modern design systems.'
    }
  ])

  // Skills list
  const [skills, setSkills] = useState<string[]>(
    initialData?.skills && initialData.skills.length > 0 
      ? initialData.skills 
      : ['JavaScript', 'TypeScript', 'React', 'Python', 'SQL', 'Git']
  )
  const [newSkill, setNewSkill] = useState('')

  const [isGeneratingAi, setIsGeneratingAi] = useState(false)

  const saveMutation = useMutation({
    mutationFn: resumeApi.createBuilt,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast.success('Resume created and saved successfully!')
      if (onSaved) onSaved(data)
      onClose()
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Failed to save resume')
    }
  })

  if (!isOpen) return null

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()])
      setNewSkill('')
    }
  }

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove))
  }

  const handleAiGenerateSummary = () => {
    setIsGeneratingAi(true)
    setTimeout(() => {
      const generated = `Driven ${targetRole || 'Professional'} with a strong foundation in ${skills.slice(0, 3).join(', ')}. Demonstrated ability in designing robust, user-centric solutions through academic and project work. Passionate about applying modern technologies to solve complex real-world challenges.`
      setSummary(generated)
      setIsGeneratingAi(false)
      toast.success('AI summary generated!')
    }, 600)
  }

  const handleSave = () => {
    const parsedJson = {
      name: fullName,
      email: email,
      phone: phone,
      location: location,
      target_role: targetRole,
      summary: summary,
      education: educations,
      experience: experiences,
      projects: projects,
      skills: skills,
      raw_text: `${fullName}\n${email} | ${phone} | ${location}\n\nSUMMARY\n${summary}\n\nEDUCATION\n${educations.map(e => `${e.degree} - ${e.institution} (${e.gradYear})`).join('\n')}\n\nEXPERIENCE\n${experiences.map(e => `${e.title} at ${e.company}\n${e.description}`).join('\n')}\n\nPROJECTS\n${projects.map(p => `${p.name} (${p.tech})\n${p.description}`).join('\n')}\n\nSKILLS\n${skills.join(', ')}`
    }

    saveMutation.mutate({
      label: `${fullName || 'My'} Resume (${targetRole})`,
      fileName: `${(fullName || 'Resume').replace(/\s+/g, '_')}_Built.pdf`,
      parsedJson
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-[var(--color-outline-variant)]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--color-outline-variant)] flex items-center justify-between bg-[var(--color-surface)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
                 style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-container) 100%)' }}>
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--color-on-surface)' }}>AI Resume Builder</h2>
              <p className="text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>Create an ATS-optimized, high-impact resume in minutes</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] px-6 overflow-x-auto">
          {[
            { id: 'basics', label: '1. Contact & Summary', icon: User },
            { id: 'education', label: '2. Education', icon: GraduationCap },
            { id: 'experience', label: '3. Experience & Projects', icon: Briefcase },
            { id: 'skills', label: '4. Skills', icon: Code },
            { id: 'preview', label: '5. Preview & Finalize', icon: Eye },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                  isActive 
                    ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-white' 
                    : 'border-transparent text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'basics' && (
            <div className="max-w-2xl mx-auto space-y-5 animate-in fade-in">
              <h3 className="text-base font-bold text-[var(--color-on-surface)]">Personal & Contact Information</h3>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1 text-[var(--color-on-surface)]">Full Name</label>
                  <input 
                    type="text" 
                    value={fullName} 
                    onChange={e => setFullName(e.target.value)} 
                    placeholder="e.g. Alex Johnson" 
                    className="input" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-[var(--color-on-surface)]">Target Role / Title</label>
                  <input 
                    type="text" 
                    value={targetRole} 
                    onChange={e => setTargetRole(e.target.value)} 
                    placeholder="e.g. Frontend Engineer, Product Analyst" 
                    className="input" 
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1 text-[var(--color-on-surface)]">Email</label>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    placeholder="alex@example.com" 
                    className="input" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-[var(--color-on-surface)]">Phone</label>
                  <input 
                    type="tel" 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)} 
                    placeholder="+91 98765 43210" 
                    className="input" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1 text-[var(--color-on-surface)]">Location</label>
                <input 
                  type="text" 
                  value={location} 
                  onChange={e => setLocation(e.target.value)} 
                  placeholder="e.g. Bengaluru, India or Remote" 
                  className="input" 
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-[var(--color-on-surface)]">Professional Summary</label>
                  <button 
                    type="button" 
                    onClick={handleAiGenerateSummary}
                    disabled={isGeneratingAi}
                    className="text-xs text-[var(--color-primary)] font-semibold flex items-center gap-1 hover:underline disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {isGeneratingAi ? 'Generating...' : 'AI Enhance Summary'}
                  </button>
                </div>
                <textarea 
                  rows={4} 
                  value={summary} 
                  onChange={e => setSummary(e.target.value)} 
                  className="input leading-relaxed" 
                  placeholder="Brief 2-3 line summary highlighting your key background and strengths..."
                />
              </div>
            </div>
          )}

          {activeTab === 'education' && (
            <div className="max-w-2xl mx-auto space-y-5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[var(--color-on-surface)]">Education Background</h3>
                <button 
                  onClick={() => setEducations([...educations, { institution: '', degree: '', gradYear: '', gpa: '' }])}
                  className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Degree
                </button>
              </div>

              {educations.map((edu, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface)] space-y-3 relative">
                  {educations.length > 1 && (
                    <button 
                      onClick={() => setEducations(educations.filter((_, i) => i !== idx))}
                      className="absolute top-3 right-3 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1 text-[var(--color-on-surface)]">Institution / University</label>
                      <input 
                        type="text" 
                        value={edu.institution} 
                        onChange={e => {
                          const updated = [...educations]
                          updated[idx].institution = e.target.value
                          setEducations(updated)
                        }}
                        placeholder="e.g. National Institute of Technology" 
                        className="input" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1 text-[var(--color-on-surface)]">Degree & Major</label>
                      <input 
                        type="text" 
                        value={edu.degree} 
                        onChange={e => {
                          const updated = [...educations]
                          updated[idx].degree = e.target.value
                          setEducations(updated)
                        }}
                        placeholder="e.g. B.Tech in Computer Science" 
                        className="input" 
                      />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1 text-[var(--color-on-surface)]">Graduation Year</label>
                      <input 
                        type="text" 
                        value={edu.gradYear} 
                        onChange={e => {
                          const updated = [...educations]
                          updated[idx].gradYear = e.target.value
                          setEducations(updated)
                        }}
                        placeholder="e.g. 2025" 
                        className="input" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1 text-[var(--color-on-surface)]">GPA / Percentage (Optional)</label>
                      <input 
                        type="text" 
                        value={edu.gpa} 
                        onChange={e => {
                          const updated = [...educations]
                          updated[idx].gpa = e.target.value
                          setEducations(updated)
                        }}
                        placeholder="e.g. 8.5 / 10" 
                        className="input" 
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'experience' && (
            <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in">
              {/* Experience */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[var(--color-on-surface)]">Work & Internship Experience</h3>
                  <button 
                    onClick={() => setExperiences([...experiences, { title: '', company: '', duration: '', description: '' }])}
                    className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Experience
                  </button>
                </div>

                {experiences.map((exp, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface)] space-y-3 relative">
                    <button 
                      onClick={() => setExperiences(experiences.filter((_, i) => i !== idx))}
                      className="absolute top-3 right-3 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">Role Title</label>
                        <input 
                          type="text" 
                          value={exp.title} 
                          onChange={e => {
                            const updated = [...experiences]
                            updated[idx].title = e.target.value
                            setExperiences(updated)
                          }}
                          placeholder="e.g. Software Engineer Intern" 
                          className="input" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Company / Organization</label>
                        <input 
                          type="text" 
                          value={exp.company} 
                          onChange={e => {
                            const updated = [...experiences]
                            updated[idx].company = e.target.value
                            setExperiences(updated)
                          }}
                          placeholder="e.g. Acme Corp" 
                          className="input" 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Bullet Points & Impact</label>
                      <textarea 
                        rows={3}
                        value={exp.description} 
                        onChange={e => {
                          const updated = [...experiences]
                          updated[idx].description = e.target.value
                          setExperiences(updated)
                        }}
                        placeholder="• Implemented X resulting in Y% improvement..." 
                        className="input" 
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Projects */}
              <div className="space-y-4 pt-4 border-t border-[var(--color-outline-variant)]">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[var(--color-on-surface)]">Key Projects</h3>
                  <button 
                    onClick={() => setProjects([...projects, { name: '', tech: '', description: '' }])}
                    className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Project
                  </button>
                </div>

                {projects.map((proj, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface)] space-y-3 relative">
                    <button 
                      onClick={() => setProjects(projects.filter((_, i) => i !== idx))}
                      className="absolute top-3 right-3 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">Project Name</label>
                        <input 
                          type="text" 
                          value={proj.name} 
                          onChange={e => {
                            const updated = [...projects]
                            updated[idx].name = e.target.value
                            setProjects(updated)
                          }}
                          placeholder="e.g. Autonomous Robot Simulation" 
                          className="input" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Technologies Used</label>
                        <input 
                          type="text" 
                          value={proj.tech} 
                          onChange={e => {
                            const updated = [...projects]
                            updated[idx].tech = e.target.value
                            setProjects(updated)
                          }}
                          placeholder="e.g. Python, ROS, OpenCV" 
                          className="input" 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Description & Outcomes</label>
                      <textarea 
                        rows={2}
                        value={proj.description} 
                        onChange={e => {
                          const updated = [...projects]
                          updated[idx].description = e.target.value
                          setProjects(updated)
                        }}
                        placeholder="• Designed and trained algorithms for real-time obstacle avoidance..." 
                        className="input" 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'skills' && (
            <div className="max-w-2xl mx-auto space-y-5 animate-in fade-in">
              <h3 className="text-base font-bold text-[var(--color-on-surface)]">Technical & Professional Skills</h3>
              <p className="text-xs text-[var(--color-on-surface-variant)]">Add relevant skills to match with high-score opportunities.</p>

              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newSkill} 
                  onChange={e => setNewSkill(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                  placeholder="Type skill name (e.g. Docker, Tailwind CSS, PyTorch)..." 
                  className="input flex-1" 
                />
                <button 
                  onClick={handleAddSkill}
                  className="btn-primary text-xs px-4"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {skills.map((s) => (
                  <span 
                    key={s} 
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[var(--color-surface-container)] text-[var(--color-primary)] border border-[var(--color-outline-variant)]"
                  >
                    {s}
                    <button 
                      onClick={() => handleRemoveSkill(s)} 
                      className="hover:text-red-500 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Suggestions */}
              <div className="pt-4 border-t border-[var(--color-outline-variant)]">
                <p className="text-xs font-semibold text-[var(--color-on-surface-variant)] mb-2">Recommended popular skills:</p>
                <div className="flex flex-wrap gap-1.5">
                  {['React', 'Next.js', 'Node.js', 'Python', 'Java', 'SQL', 'PostgreSQL', 'Docker', 'AWS', 'TailwindCSS', 'Machine Learning', 'Git'].map(rec => (
                    !skills.includes(rec) && (
                      <button 
                        key={rec} 
                        onClick={() => setSkills([...skills, rec])}
                        className="text-xs px-2.5 py-1 rounded-md border border-dashed border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all"
                      >
                        + {rec}
                      </button>
                    )
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="max-w-3xl mx-auto space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--color-outline-variant)]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="font-semibold text-sm">ATS Optimized Standard Template</span>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Estimated ATS Score: 88%
                </span>
              </div>

              {/* Resume Card Preview */}
              <div className="p-8 bg-white border border-gray-300 rounded-xl shadow-sm text-gray-900 font-sans text-sm space-y-5">
                {/* Header */}
                <div className="text-center border-b pb-4">
                  <h1 className="text-2xl font-bold tracking-tight text-gray-900">{fullName || 'Your Name'}</h1>
                  <p className="text-xs font-semibold text-indigo-700 mt-0.5">{targetRole || 'Professional Title'}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {[email, phone, location].filter(Boolean).join(' • ')}
                  </p>
                </div>

                {/* Summary */}
                {summary && (
                  <div>
                    <h2 className="text-xs font-bold tracking-wider uppercase text-gray-700 border-b border-gray-200 pb-1 mb-2">Professional Summary</h2>
                    <p className="text-xs leading-relaxed text-gray-700">{summary}</p>
                  </div>
                )}

                {/* Education */}
                {educations.length > 0 && educations[0].institution && (
                  <div>
                    <h2 className="text-xs font-bold tracking-wider uppercase text-gray-700 border-b border-gray-200 pb-1 mb-2">Education</h2>
                    <div className="space-y-2">
                      {educations.map((edu, idx) => (
                        <div key={idx} className="flex justify-between text-xs">
                          <div>
                            <p className="font-semibold text-gray-900">{edu.degree || 'Degree'}</p>
                            <p className="text-gray-600">{edu.institution || 'University'}</p>
                          </div>
                          <div className="text-right text-gray-500">
                            <p>{edu.gradYear}</p>
                            {edu.gpa && <p>GPA: {edu.gpa}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Experience */}
                {experiences.length > 0 && experiences[0].title && (
                  <div>
                    <h2 className="text-xs font-bold tracking-wider uppercase text-gray-700 border-b border-gray-200 pb-1 mb-2">Experience</h2>
                    <div className="space-y-3">
                      {experiences.map((exp, idx) => (
                        <div key={idx} className="text-xs">
                          <div className="flex justify-between font-semibold">
                            <span>{exp.title} — {exp.company}</span>
                            <span className="text-gray-500 font-normal">{exp.duration}</span>
                          </div>
                          <p className="text-gray-700 whitespace-pre-line mt-1">{exp.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Projects */}
                {projects.length > 0 && projects[0].name && (
                  <div>
                    <h2 className="text-xs font-bold tracking-wider uppercase text-gray-700 border-b border-gray-200 pb-1 mb-2">Projects</h2>
                    <div className="space-y-2">
                      {projects.map((proj, idx) => (
                        <div key={idx} className="text-xs">
                          <p className="font-semibold">{proj.name} <span className="font-normal text-gray-500">({proj.tech})</span></p>
                          <p className="text-gray-700 whitespace-pre-line mt-0.5">{proj.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills */}
                {skills.length > 0 && (
                  <div>
                    <h2 className="text-xs font-bold tracking-wider uppercase text-gray-700 border-b border-gray-200 pb-1 mb-2">Technical Skills</h2>
                    <p className="text-xs text-gray-800">{skills.join(' • ')}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-[var(--color-outline-variant)] bg-[var(--color-surface)] flex items-center justify-between">
          <div>
            {activeTab !== 'basics' ? (
              <button 
                onClick={() => {
                  const tabs: any[] = ['basics', 'education', 'experience', 'skills', 'preview']
                  const idx = tabs.indexOf(activeTab)
                  if (idx > 0) setActiveTab(tabs[idx - 1])
                }}
                className="btn-secondary text-xs flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            ) : (
              <span />
            )}
          </div>

          <div className="flex items-center gap-3">
            {activeTab !== 'preview' ? (
              <button 
                onClick={() => {
                  const tabs: any[] = ['basics', 'education', 'experience', 'skills', 'preview']
                  const idx = tabs.indexOf(activeTab)
                  if (idx < tabs.length - 1) setActiveTab(tabs[idx + 1])
                }}
                className="btn-primary text-xs flex items-center gap-1.5"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button 
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="btn-primary text-xs flex items-center gap-1.5 px-6 disabled:opacity-50"
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Save & Use Resume
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
