import { useState, useRef, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { resumeApi, profileApi } from "@/api/endpoints"
import { useAuthStore } from "@/store/authStore"
import {
  Sparkles, GraduationCap, Briefcase,
  Send, Bot, User, CheckCircle, ArrowRight, Paperclip, Loader2
} from "lucide-react"
import toast from "react-hot-toast"

type Role = "assistant" | "user"
type MsgType = "text" | "choice" | "upload" | "status" | "finish"
interface ChatOption { label: string; value: string; icon?: React.ElementType }
interface ChatMessage {
  id: string; role: Role; type: MsgType; text: string
  options?: ChatOption[]; uploadLabel?: string; timestamp: Date; isLoading?: boolean
}
interface ProfileData {
  roleType: "student" | "graduate" | null; name?: string; college?: string; degree?: string
  year?: string; gradYear?: string; gpa?: string; targetRole?: string; location?: string
  workMode?: string; skills?: string[]; company?: string; experienceYears?: string
  expectedCtc?: string; noticePeriod?: string; resumeSource?: "uploaded" | "manual"
  parsedData?: Record<string, unknown>
}

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || ""

async function geminiChat(prompt: string): Promise<string> {
  if (!GEMINI_KEY) return ""
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.4, maxOutputTokens: 500 } })
      }
    )
    const data = await res.json()
    return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ""
  } catch { return "" }
}

async function parseResumeWithGemini(rawText: string): Promise<Record<string, unknown>> {
  const prompt = `Parse this resume into JSON with fields: contact (name,email,phone,location), summary, skills (string[]), experience ({company,title,start,end,bullets}[]), education ({institution,degree,field,start,end,gpa}[]), projects ({name,description,tech}[]), certifications ({name,issuer,date}[]). Return ONLY valid JSON.\n\n${rawText.slice(0, 8000)}`
  const response = await geminiChat(prompt)
  try { return JSON.parse(response.replace(/```json\n?|\n?```/g, "").trim()) }
  catch { return {} }
}

async function extractTextFromFile(file: File, token: string): Promise<string> {
  const formData = new FormData()
  formData.append("file", file)
  try {
    const res = await fetch("/api/v1/resumes/extract-text", { method: "POST", body: formData, headers: { Authorization: `Bearer ${token}` } })
    if (res.ok) { const d = await res.json(); return d.text || "" }
  } catch { /* ignore */ }
  return `Resume file: ${file.name}`
}

let _id = 0
function nextId() { return String(++_id) }

function BotMessage({ msg, onChoice, onUpload }: {
  msg: ChatMessage; onChoice?: (v: string, l: string) => void; onUpload?: (f: File) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  return (
    <div className="flex gap-3 items-start animate-in slide-in-from-left-4 fade-in duration-300">
      <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center shadow-sm" style={{ background: "linear-gradient(135deg,#3525cd,#4f46e5)" }}>
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 space-y-3 max-w-lg">
        <div className="rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed shadow-sm" style={{ background: "var(--color-surface-container)", color: "var(--color-on-surface)" }}>
          {msg.isLoading ? (
            <span className="flex gap-1 items-center h-4">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
            </span>
          ) : <span className="whitespace-pre-wrap">{msg.text}</span>}
        </div>
        {msg.options && !msg.isLoading && (
          <div className="flex flex-wrap gap-2">
            {msg.options.map(opt => {
              const Icon = opt.icon
              return (
                <button key={opt.value} onClick={() => onChoice?.(opt.value, opt.label)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-all hover:shadow-md active:scale-95"
                  style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)", background: "var(--color-surface-container-low)" }}>
                  {Icon && <Icon className="w-4 h-4" />}{opt.label}
                </button>
              )
            })}
          </div>
        )}
        {msg.type === "upload" && !msg.isLoading && (
          <div>
            <input type="file" accept=".pdf,.docx,.doc" className="hidden" ref={fileRef} onChange={e => e.target.files?.[0] && onUpload?.(e.target.files[0])} />
            <button onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed text-sm font-semibold transition-all hover:shadow-md"
              style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)", background: "var(--color-surface-container-low)" }}>
              <Paperclip className="w-4 h-4" />{msg.uploadLabel || "Attach Resume (PDF / DOCX)"}
            </button>
          </div>
        )}
        {msg.type === "finish" && !msg.isLoading && (
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600"><CheckCircle className="w-4 h-4" />Profile complete!</div>
        )}
      </div>
    </div>
  )
}

function UserMessage({ msg }: { msg: ChatMessage }) {
  return (
    <div className="flex gap-3 items-start justify-end animate-in slide-in-from-right-4 fade-in duration-300">
      <div className="max-w-sm rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed shadow-sm" style={{ background: "var(--color-primary)", color: "white" }}>
        <span className="whitespace-pre-wrap">{msg.text}</span>
      </div>
      <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-white shadow-sm" style={{ background: "var(--color-on-surface)" }}>
        <User className="w-4 h-4" />
      </div>
    </div>
  )
}

type Phase = "greeting" | "role" | "resume_offer" | "resume_upload" | "manual_build" | "ask_field" | "confirm" | "saving" | "done"

export default function Onboarding() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore(s => s.user)
  const accessToken = useAuthStore(s => s.accessToken)
  const firstName = user?.firstName || "there"

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isThinking, setIsThinking] = useState(false)
  const [inputEnabled, setInputEnabled] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState("")
  const [profile, setProfile] = useState<ProfileData>({ roleType: null, skills: [] })
  const [phase, setPhase] = useState<Phase>("greeting")
  const [pendingFields, setPendingFields] = useState<string[]>([])
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const phaseRef = useRef<Phase>("greeting")
  phaseRef.current = phase

  const profileMutation = useMutation({ mutationFn: profileApi.update })
  const builderMutation = useMutation({ mutationFn: resumeApi.createBuilt })
  const uploadMutation = useMutation({
    mutationFn: resumeApi.upload,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["resumes"] }); queryClient.invalidateQueries({ queryKey: ["profile"] }) }
  })

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  const addMsg = useCallback((msg: Omit<ChatMessage, "id" | "timestamp">) => {
    const full = { ...msg, id: nextId(), timestamp: new Date() }
    setMessages(prev => [...prev, full])
    return full
  }, [])

  const typedBot = useCallback(async (text: string, opts?: { options?: ChatOption[]; type?: MsgType; uploadLabel?: string; delay?: number }) => {
    setIsThinking(true)
    const id = nextId()
    setMessages(prev => [...prev, { id, role: "assistant", type: "text", text: "", timestamp: new Date(), isLoading: true }])
    await new Promise(r => setTimeout(r, opts?.delay ?? 800))
    const fullMsg: ChatMessage = { id, role: "assistant", type: opts?.type || (opts?.options ? "choice" : "text"), text, options: opts?.options, uploadLabel: opts?.uploadLabel, timestamp: new Date(), isLoading: false }
    setMessages(prev => prev.map(m => m.id === id ? fullMsg : m))
    setIsThinking(false)
  }, [])

  const addUserMsg = useCallback((text: string) => { addMsg({ role: "user", type: "text", text }) }, [addMsg])

  const studentFields: Array<{ key: string; question: string }> = [
    { key: "college", question: "Which college or university are you attending?" },
    { key: "degree", question: "What degree and branch are you studying? (e.g. B.Tech Computer Science)" },
    { key: "year", question: "Which year are you in? (e.g. Final Year, 3rd Year)" },
    { key: "gradYear", question: "When do you expect to graduate? (e.g. 2025)" },
    { key: "gpa", question: "What's your current CGPA / GPA? (type \"skip\" to skip)" },
    { key: "targetRole", question: "What kind of role or internship are you targeting?" },
    { key: "location", question: "Where would you prefer to work? (e.g. Bangalore, Remote)" },
    { key: "workMode", question: "Do you prefer Remote, Hybrid, or On-site?" },
    { key: "skills", question: "List your top skills (comma-separated, e.g. Python, React, SQL)" },
  ]
  const graduateFields: Array<{ key: string; question: string }> = [
    { key: "targetRole", question: "What's your current role or professional headline?" },
    { key: "company", question: "Where do you currently/recently work? (type \"none\" if seeking first role)" },
    { key: "experienceYears", question: "How many years of experience do you have? (e.g. Fresher, 1-2 years)" },
    { key: "college", question: "Which college did you graduate from?" },
    { key: "degree", question: "What is your highest degree? (e.g. B.Tech / M.S. CSE)" },
    { key: "gradYear", question: "Which year did you graduate?" },
    { key: "location", question: "Preferred work location?" },
    { key: "workMode", question: "Do you prefer Remote, Hybrid, or On-site?" },
    { key: "expectedCtc", question: "Expected CTC / salary? (type \"skip\" to skip)" },
    { key: "noticePeriod", question: "Notice period in days? (type 0 for immediate joiner)" },
    { key: "skills", question: "List your core skills (comma-separated)" },
  ]

  const started = useRef(false)
  useEffect(() => {
    if (started.current) return
    started.current = true
    const run = async () => {
      await typedBot(`Hey ${firstName}! ?? Welcome to HireMatch AI.\n\nI'm your personal career assistant. Let's set up your profile together through a quick conversation. Ready? ??`, { delay: 600 })
      await new Promise(r => setTimeout(r, 300))
      await typedBot("First — are you currently a student, or have you already graduated?", {
        options: [
          { label: "?? Student / In College", value: "student", icon: GraduationCap },
          { label: "?? Graduate / Professional", value: "graduate", icon: Briefcase }
        ], delay: 500
      })
      setPhase("role")
    }
    run()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const showConfirmation = useCallback(async (p: ProfileData) => {
    const isStudent = p.roleType === "student"
    const lines = [
      `?? Role: ${isStudent ? "Student" : "Graduate/Professional"}`,
      p.college && `?? College: ${p.college}`,
      p.degree && `?? Degree: ${p.degree}`,
      p.gradYear && `?? Graduation: ${p.gradYear}`,
      p.gpa && p.gpa !== "skip" && `?? GPA: ${p.gpa}`,
      p.targetRole && `?? Target: ${p.targetRole}`,
      p.company && p.company !== "none" && `?? Company: ${p.company}`,
      p.experienceYears && `? Experience: ${p.experienceYears}`,
      p.location && `?? Location: ${p.location}`,
      p.workMode && `?? Work Mode: ${p.workMode}`,
      (p.skills?.length ?? 0) > 0 && `??? Skills: ${p.skills!.slice(0, 5).join(", ")}${(p.skills?.length ?? 0) > 5 ? "..." : ""}`,
    ].filter(Boolean)
    await typedBot(`Here's your profile summary:\n\n${lines.join("\n")}\n\nShall I create your profile with this info?`, {
      options: [
        { label: "?? Yes, set up my profile!", value: "save" },
        { label: "?? Let me change something", value: "redo" }
      ], delay: 600
    })
    setPhase("confirm")
  }, [typedBot])

  const askNextField = useCallback(async (fields: Array<{ key: string; question: string }>, remaining: string[], updatedProfile: ProfileData) => {
    if (remaining.length === 0) {
      setPendingFields([])
      await new Promise(r => setTimeout(r, 200))
      await showConfirmation(updatedProfile)
      return
    }
    const nextKey = remaining[0]
    const nextField = fields.find(f => f.key === nextKey)
    setPendingFields(remaining)
    setCurrentQuestion(nextKey)
    setPhase("ask_field")
    await typedBot(nextField?.question || "", { delay: 350 })
    setInputEnabled(true)
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [showConfirmation, typedBot])

  const handleChoice = useCallback(async (value: string, label: string) => {
    if (isThinking) return
    const currentPhase = phaseRef.current

    if (currentPhase === "confirm") {
      addUserMsg(label)
      if (value === "redo") {
        const fields = profile.roleType === "student" ? studentFields : graduateFields
        const allKeys = fields.map(f => f.key)
        setPendingFields(allKeys)
        setCurrentQuestion(fields[0].key)
        setPhase("manual_build")
        await typedBot("Of course! Let's go through the questions again.", { delay: 400 })
        await new Promise(r => setTimeout(r, 300))
        await typedBot(fields[0].question, { delay: 400 })
        setInputEnabled(true)
        return
      }
      // save
      setPhase("saving")
      await typedBot("Perfect! Setting up your profile now... ??", { delay: 300 })
      try {
        const p = profile
        const isStudent = p.roleType === "student"
        const bioText = isStudent
          ? `Student at ${p.college || "University"} pursuing ${p.degree || "degree"} (${p.year || ""}, graduating ${p.gradYear || ""}). Seeking ${p.targetRole || "internship"}. Core Skills: ${(p.skills || []).join(", ")}.`
          : `${p.targetRole || "Professional"}${p.company && p.company !== "none" ? " at " + p.company : ""} with ${p.experienceYears || "0"} experience. Graduated ${p.gradYear || ""} with ${p.degree || "degree"} from ${p.college || "University"}. Core Skills: ${(p.skills || []).join(", ")}.`
        await profileMutation.mutateAsync({
          bio: bioText, location: p.location,
          preferredWorkMode: (p.workMode || "HYBRID").toUpperCase().replace(/[- ]/g, "").replace("ONSITE", "ONSITE"),
          ...(p.noticePeriod && p.noticePeriod !== "skip" && !isNaN(parseInt(p.noticePeriod)) ? { noticePeriodDays: parseInt(p.noticePeriod) } : {}),
          ...(p.expectedCtc && p.expectedCtc !== "skip" ? { expectedCtc: parseFloat(p.expectedCtc.replace(/[^0-9.]/g, "")) || undefined } : {})
        })
        if (!uploadedFile) {
          await builderMutation.mutateAsync({
            label: "Onboarding Profile", fileName: "onboarding-resume.json",
            parsedJson: {
              contact: { name: `${user?.firstName} ${user?.lastName}`.trim(), email: user?.email },
              summary: bioText, skills: p.skills || [],
              education: [{ institution: p.college, degree: p.degree, end: p.gradYear, gpa: p.gpa }],
              experience: p.company && p.company !== "none" ? [{ company: p.company, title: p.targetRole, bullets: [] }] : [],
              projects: [], certifications: []
            }
          })
        }
        queryClient.invalidateQueries({ queryKey: ["profile"] })
        queryClient.invalidateQueries({ queryKey: ["resumes"] })
        sessionStorage.setItem("onboarding_completed", "true")
        await typedBot(`?? You're all set, ${firstName}!\n\nYour profile is live and I'm already matching you with jobs. Welcome aboard!`, { type: "finish", delay: 500 })
        setPhase("done")
        setTimeout(() => { navigate("/profile"); toast.success(`Welcome to HireMatch AI, ${firstName}!`) }, 2000)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error"
        await typedBot(`Hmm, there was an issue: ${msg}. Let's try again.`, { delay: 400 })
        setPhase("confirm")
      }
      return
    }

    addUserMsg(label)

    if (currentPhase === "role") {
      const rt = value as "student" | "graduate"
      setProfile(p => ({ ...p, roleType: rt }))
      setPhase("resume_offer")
      await typedBot(
        rt === "student"
          ? `Great, ${firstName}! ?? As a student I can help you build an internship-ready profile.\n\nDo you have a resume to upload? I'll extract everything automatically — or we can build it together step by step.`
          : `Awesome! ?? Let's get you matched with the best opportunities.\n\nDo you have an existing resume? I'll read it and fill your profile, or we can do it together from scratch.`,
        { options: [{ label: "?? Upload my resume", value: "upload" }, { label: "?? Build profile manually", value: "manual" }] }
      )
    } else if (currentPhase === "resume_offer") {
      if (value === "upload") {
        setPhase("resume_upload")
        await typedBot("Perfect! Go ahead and attach your resume below. I accept PDF or DOCX.", { type: "upload", uploadLabel: "Attach Resume (PDF / DOCX)" })
      } else {
        setPhase("manual_build")
        const fields = profile.roleType === "student" ? studentFields : graduateFields
        const allKeys = fields.map(f => f.key)
        setPendingFields(allKeys)
        setCurrentQuestion(fields[0].key)
        await typedBot("No problem! I'll ask you a few quick questions. Let's go! ??", { delay: 500 })
        await new Promise(r => setTimeout(r, 300))
        await typedBot(fields[0].question, { delay: 400 })
        setInputEnabled(true)
        setTimeout(() => inputRef.current?.focus(), 100)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isThinking, profile, addUserMsg, typedBot, profileMutation, builderMutation, uploadedFile, user, queryClient, navigate, firstName, showConfirmation])

  const handleFileUpload = useCallback(async (file: File) => {
    if (isThinking) return
    setUploadedFile(file)
    addUserMsg(`?? Uploaded: ${file.name}`)
    await typedBot("Got it! Reading your resume... hang on ??", { delay: 400 })
    try {
      const formData = new FormData()
      formData.append("file", file)
      uploadMutation.mutate(formData)
      let parsed: Record<string, unknown> = {}
      if (GEMINI_KEY) {
        const text = await extractTextFromFile(file, accessToken || "")
        if (text && text.length > 50) parsed = await parseResumeWithGemini(text)
      }
      const skills = (parsed.skills as string[]) || []
      const education = (parsed.education as Array<Record<string, string>>) || []
      const experience = (parsed.experience as Array<Record<string, string>>) || []
      const edu0 = education[0] || {}
      const exp0 = experience[0] || {}
      const extracted: Partial<ProfileData> = {
        college: edu0.institution, degree: edu0.degree ? `${edu0.degree}${edu0.field ? " in " + edu0.field : ""}` : undefined,
        gradYear: edu0.end, gpa: edu0.gpa, skills: skills.slice(0, 20),
        company: exp0.company, targetRole: exp0.title, resumeSource: "uploaded", parsedData: parsed
      }
      const updatedProfile = { ...profile, ...extracted }
      setProfile(updatedProfile)
      const allFields = profile.roleType === "student" ? studentFields : graduateFields
      const missing = allFields.filter(f => { const v = (extracted as Record<string, unknown>)[f.key]; return !v || (Array.isArray(v) && v.length === 0) })
      if (missing.length === 0) {
        const summary = [
          edu0.degree && `?? Degree: ${extracted.degree}`,
          edu0.institution && `?? College: ${extracted.college}`,
          skills.length && `??? Skills: ${skills.slice(0, 4).join(", ")}`,
        ].filter(Boolean).join("\n")
        await typedBot(`I found everything from your resume! ??\n\n${summary}\n\nDoes this look right?`, {
          options: [{ label: "? Yes, looks good!", value: "save" }, { label: "?? Edit some details", value: "redo" }]
        })
        setPhase("confirm")
      } else {
        const summary = [
          (extracted.skills?.length ?? 0) > 0 && `? Skills: ${skills.slice(0, 4).join(", ")}`,
          extracted.college && `? College: ${extracted.college}`,
          extracted.degree && `? Degree: ${extracted.degree}`,
        ].filter(Boolean).join("\n")
        await typedBot(`Parsed your resume! ??\n\n${summary || "Found some details."}\n\nI just need a few more things to complete your profile. Quick!`, { delay: 300 })
        await new Promise(r => setTimeout(r, 400))
        await askNextField(allFields, missing.map(f => f.key), updatedProfile)
      }
    } catch {
      await typedBot("Hmm, had trouble reading that file. Let's build your profile together instead!", { delay: 400 })
      const fields = profile.roleType === "student" ? studentFields : graduateFields
      setPendingFields(fields.map(f => f.key))
      setCurrentQuestion(fields[0].key)
      setPhase("manual_build")
      await typedBot(fields[0].question, { delay: 400 })
      setInputEnabled(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isThinking, profile, addUserMsg, typedBot, uploadMutation, accessToken, askNextField])

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    const value = inputValue.trim()
    if (!value || isThinking || !inputEnabled) return
    setInputValue("")
    setInputEnabled(false)
    addUserMsg(value)

    const currentPhase = phaseRef.current
    if (currentPhase !== "manual_build" && currentPhase !== "ask_field") return

    const fields = profile.roleType === "student" ? studentFields : graduateFields
    const skip = ["skip", "none"].includes(value.toLowerCase())
    let updatedProfile = { ...profile }

    if (!skip && currentQuestion) {
      if (currentQuestion === "skills") {
        const parsed = value.split(",").map(s => s.trim()).filter(Boolean)
        updatedProfile = { ...updatedProfile, skills: parsed }
      } else {
        updatedProfile = { ...updatedProfile, [currentQuestion]: value }
      }
      setProfile(updatedProfile)

      let ack = "? Got it!"
      if (GEMINI_KEY) {
        const currentField = fields.find(f => f.key === currentQuestion)
        const aiAck = await geminiChat(`User answered "${value}" for "${currentField?.question || currentQuestion}". Write a SHORT (max 10 words), warm, friendly acknowledgement. Do NOT ask new questions.`)
        if (aiAck && aiAck.length < 100) ack = aiAck
      }
      await typedBot(ack, { delay: 300 })
    } else {
      updatedProfile = { ...updatedProfile }
    }

    const remaining = pendingFields.filter(f => f !== currentQuestion)
    await new Promise(r => setTimeout(r, 200))
    await askNextField(fields, remaining, updatedProfile)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue, isThinking, inputEnabled, profile, currentQuestion, pendingFields, addUserMsg, typedBot, askNextField])

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--color-surface-container-lowest)" }}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b shadow-sm" style={{ background: "var(--color-surface-container-lowest)", borderColor: "var(--color-outline-variant)" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow" style={{ background: "linear-gradient(135deg,#3525cd,#4f46e5)" }}>
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold" style={{ color: "var(--color-on-surface)" }}>HireMatch AI</h1>
            <p className="text-xs" style={{ color: "var(--color-on-surface-variant)" }}>Profile Setup Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium" style={{ color: "var(--color-on-surface-variant)" }}>
          {phase === "done" ? (
            <span className="flex items-center gap-1 text-emerald-600 font-semibold"><CheckCircle className="w-4 h-4" /> Complete</span>
          ) : isThinking ? (
            <span className="flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Thinking...</span>
          ) : (
            <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Assistant active</span>
          )}
        </div>
      </header>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-2xl w-full mx-auto">
        {messages.map(msg =>
          msg.role === "assistant" ? (
            <BotMessage key={msg.id} msg={msg}
              onChoice={handleChoice}
              onUpload={phase === "resume_upload" ? handleFileUpload : undefined}
            />
          ) : <UserMessage key={msg.id} msg={msg} />
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="border-t px-4 py-4" style={{ background: "var(--color-surface-container-lowest)", borderColor: "var(--color-outline-variant)" }}>
        <div className="max-w-2xl mx-auto">
          {phase === "done" && (
            <div className="text-center">
              <button onClick={() => navigate("/profile")} className="btn-primary inline-flex items-center gap-2 px-8 py-3">
                Enter Dashboard <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
          {inputEnabled && (phase === "manual_build" || phase === "ask_field") && (
            <form onSubmit={handleSubmit} className="flex gap-3">
              <input ref={inputRef} type="text" value={inputValue} onChange={e => setInputValue(e.target.value)}
                placeholder="Type your answer..." disabled={!inputEnabled || isThinking}
                className="flex-1 rounded-xl border px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-indigo-400"
                style={{ borderColor: "var(--color-outline-variant)", background: "var(--color-surface-container-low)", color: "var(--color-on-surface)" }}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit() } }}
              />
              <button type="submit" disabled={!inputEnabled || isThinking || !inputValue.trim()}
                className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-sm transition-all hover:opacity-90 disabled:opacity-40"
                style={{ background: "var(--color-primary)" }}>
                {isThinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          )}
          {!inputEnabled && phase !== "done" && phase !== "resume_upload" && (
            <p className="text-center text-xs" style={{ color: "var(--color-on-surface-variant)" }}>
              ?? Choose one of the options above, or type your answer
            </p>
          )}
          {phase === "resume_upload" && !isThinking && (
            <p className="text-center text-xs" style={{ color: "var(--color-on-surface-variant)" }}>
              ?? Click the "Attach Resume" button in the chat above
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

