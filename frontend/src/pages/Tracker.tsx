import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, MoreHorizontal } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { applicationApi } from '@/api/endpoints'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type AppStatus = 'SAVED' | 'APPLIED' | 'UNDER_REVIEW' | 'INTERVIEW' | 'OFFER' | 'REJECTED'

interface Application {
  id: number
  jobId: number
  title: string
  company: string
  status: AppStatus
  appliedAt: string
  updatedAt: string
  score?: number
}

const COLUMNS: { id: AppStatus; label: string; color: string; bg: string }[] = [
  { id: 'SAVED',        label: 'Saved',         color: '#777587', bg: '#f1f0f8' },
  { id: 'APPLIED',      label: 'Applied',        color: '#3525cd', bg: '#e5eeff' },
  { id: 'UNDER_REVIEW', label: 'Under Review',   color: '#006b5f', bg: '#d4f7f1' },
  { id: 'INTERVIEW',    label: 'Interview',       color: '#005338', bg: '#d4f7e5' },
  { id: 'OFFER',        label: 'Offer 🎉',        color: '#065f46', bg: '#d1fae5' },
  { id: 'REJECTED',     label: 'Rejected',        color: '#991b1b', bg: '#fee2e2' },
]

function SortableAppCard({ app }: { app: Application }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: app.id.toString(), data: { ...app } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <AppCard app={app} />
    </div>
  )
}

function AppCard({ app }: { app: Application }) {
  // Use a default score visually for now
  const score = app.score || 85
  const scoreColor = score >= 80 ? '#065f46' : score >= 65 ? '#92400e' : '#991b1b'
  const scoreBg    = score >= 80 ? '#d1fae5' : score >= 65 ? '#fef3c7' : '#fee2e2'

  return (
    <div className="card p-4 cursor-grab active:cursor-grabbing group">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate" style={{ color: 'var(--color-on-surface)' }}>{app.title}</p>
          <p className="text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>{app.company}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: scoreBg, color: scoreColor }}>
            {score}%
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-2">
        {app.appliedAt
          ? <span className="text-xs" style={{ color: 'var(--color-outline)' }}>Applied {new Date(app.appliedAt).toLocaleDateString()}</span>
          : <span className="text-xs" style={{ color: 'var(--color-outline)' }}>Not applied yet</span>
        }
        <button className="opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: 'var(--color-outline)' }}>
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default function Tracker() {
  const queryClient = useQueryClient()
  const [apps, setApps] = useState<Application[]>([])
  const [activeApp, setActiveApp] = useState<Application | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['applications'],
    queryFn: applicationApi.list,
  })

  useEffect(() => {
    if (data) setApps(data)
  }, [data])

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => applicationApi.updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['applications'] })
  })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const app = apps.find((a) => a.id.toString() === active.id)
    if (app) setActiveApp(app)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveApp(null)

    if (!over) return

    const activeId = active.id
    const overId = over.id

    // Check if dragging over a column
    const overColumn = COLUMNS.find(c => c.id === overId)
    if (overColumn) {
      const activeApp = apps.find((a) => a.id.toString() === activeId)
      if (activeApp && activeApp.status !== overColumn.id) {
        setApps(prev => prev.map(a => a.id.toString() === activeId ? { ...a, status: overColumn.id } : a))
        updateStatus({ id: Number(activeId), status: overColumn.id })
      }
      return
    }

    // Check if dragging over another item
    const activeAppIndex = apps.findIndex((a) => a.id.toString() === activeId)
    const overAppIndex = apps.findIndex((a) => a.id.toString() === overId)

    if (activeAppIndex !== -1 && overAppIndex !== -1) {
      const activeApp = apps[activeAppIndex]
      const overApp = apps[overAppIndex]

      if (activeApp.status !== overApp.status) {
        // moved to different column
        setApps(prev => prev.map(a => a.id.toString() === activeId ? { ...a, status: overApp.status } : a))
        updateStatus({ id: Number(activeId), status: overApp.status })
      } else {
        // reorder in same column
        setApps(prev => arrayMove(prev, activeAppIndex, overAppIndex))
      }
    }
  }

  if (isLoading) {
    return <div className="text-center py-20">Loading applications...</div>
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-1" style={{ color: 'var(--color-on-surface)', letterSpacing: '-0.01em' }}>
            Application Tracker
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
            {apps.length} applications tracked across {COLUMNS.length} stages
          </p>
        </div>
        <Link to="/jobs" className="btn-primary gap-2 text-sm">
          <Plus className="w-4 h-4" /> Add Application
        </Link>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 'calc(100vh - 200px)' }}>
          {COLUMNS.map(col => {
            const cards = apps.filter(a => a.status === col.id)
            return (
              <SortableContext key={col.id} id={col.id} items={cards.map(c => c.id.toString())} strategy={verticalListSortingStrategy}>
                <div className="flex-shrink-0 w-72 flex flex-col">
                  {/* Column header */}
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: col.color }} />
                      <span className="font-semibold text-sm" style={{ color: 'var(--color-on-surface)' }}>{col.label}</span>
                      <span className="text-xs font-medium px-1.5 py-0.5 rounded-full"
                            style={{ background: col.bg, color: col.color }}>
                        {cards.length}
                      </span>
                    </div>
                  </div>

                  {/* Cards */}
                  <div className="flex-1 space-y-3 p-3 rounded-xl min-h-[200px]"
                       style={{ background: 'var(--color-surface-container-low)', border: '1px dashed var(--color-outline-variant)' }}>
                    {cards.length === 0 && (
                      <div className="flex items-center justify-center h-24">
                        <p className="text-xs" style={{ color: 'var(--color-outline)' }}>No applications</p>
                      </div>
                    )}
                    {cards.map(app => (
                      <SortableAppCard key={app.id} app={app} />
                    ))}
                  </div>
                </div>
              </SortableContext>
            )
          })}
        </div>
        <DragOverlay>
          {activeApp ? <AppCard app={activeApp} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
