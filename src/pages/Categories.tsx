import { useState } from 'react'
import { useCategories } from '../hooks/useCategories'
import { useAllTasks } from '../hooks/useAllTasks'
import { CATEGORY_PALETTE, CATEGORY_ICONS } from '../lib/constants'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Tag,
  Code,
  Cloud,
  Brain,
  Database,
  Globe,
  Server,
  Layers,
  Package,
  Cpu,
  Terminal,
  GitBranch,
  Book,
  Lightbulb,
  Rocket,
  Shield,
  Zap,
  Heart,
  Star,
  Target,
} from 'lucide-react'
import type { Category } from '../types'

const ICON_MAP = {
  tag: Tag,
  code: Code,
  cloud: Cloud,
  brain: Brain,
  database: Database,
  globe: Globe,
  server: Server,
  layers: Layers,
  package: Package,
  cpu: Cpu,
  terminal: Terminal,
  'git-branch': GitBranch,
  book: Book,
  lightbulb: Lightbulb,
  rocket: Rocket,
  shield: Shield,
  zap: Zap,
  heart: Heart,
  star: Star,
  target: Target,
} as const

interface CategoryForm {
  name: string
  slug: string
  short_label: string
  icon: string
  paletteIndex: number
}

const emptyForm: CategoryForm = { name: '', slug: '', short_label: '', icon: 'tag', paletteIndex: 0 }

export default function Categories() {
  const { categories, loading, addCategory, updateCategory, deleteCategory } = useCategories()
  const { tasks } = useAllTasks()
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CategoryForm>(emptyForm)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const getStatusBreakdown = (id: string) => {
    const categoryTasks = tasks.filter((t) => t.category_id === id)
    return {
      total: categoryTasks.length,
      todo: categoryTasks.filter((t) => t.status === 'todo').length,
      inprogress: categoryTasks.filter((t) => t.status === 'inprogress').length,
      done: categoryTasks.filter((t) => t.status === 'done').length,
    }
  }

  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  const handleNameChange = (name: string) => {
    setForm((f) => ({ ...f, name, slug: generateSlug(name) }))
  }

  const handleAdd = async () => {
    if (!form.name.trim() || !form.short_label.trim()) return
    const palette = CATEGORY_PALETTE[form.paletteIndex]
    await addCategory({
      name: form.name.trim(),
      slug: form.slug || generateSlug(form.name),
      short_label: form.short_label.trim().toUpperCase(),
      color: palette.color,
      accent: palette.accent,
      icon: form.icon,
    })
    setForm(emptyForm)
    setShowAdd(false)
  }

  const startEdit = (cat: Category) => {
    const paletteIdx = CATEGORY_PALETTE.findIndex((p) => p.color === cat.color)
    setEditingId(cat.id)
    setForm({
      name: cat.name,
      slug: cat.slug,
      short_label: cat.short_label,
      icon: cat.icon || 'tag',
      paletteIndex: paletteIdx >= 0 ? paletteIdx : 0,
    })
  }

  const handleUpdate = async () => {
    if (!editingId || !form.name.trim() || !form.short_label.trim()) return
    const palette = CATEGORY_PALETTE[form.paletteIndex]
    await updateCategory(editingId, {
      name: form.name.trim(),
      slug: form.slug || generateSlug(form.name),
      short_label: form.short_label.trim().toUpperCase(),
      color: palette.color,
      accent: palette.accent,
      icon: form.icon,
    })
    setEditingId(null)
    setForm(emptyForm)
  }

  const handleDelete = async (id: string) => {
    await deleteCategory(id, { skipConfirm: true })
    setDeleteConfirm(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setShowAdd(false)
    setForm(emptyForm)
  }

  if (loading) {
    return <LoadingSpinner message="Loading categories..." />
  }

  return (
    <div className="content-wrap max-w-6xl">
      <div className="page-header flex items-start justify-between gap-4 flex-wrap">
        <div>
          <span className="page-kicker">Configuration</span>
          <h1>Categories</h1>
          <p className="page-subtitle">Create category taxonomy for tasks, priorities, and reporting.</p>
        </div>
        <button
          onClick={() => {
            setShowAdd(true)
            setEditingId(null)
            setForm(emptyForm)
          }}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {(showAdd || editingId) && (
        <div className="panel p-5 mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700">{editingId ? 'Edit Category' : 'New Category'}</h3>
            <button onClick={cancelEdit} className="btn btn-ghost !p-2">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Name</label>
              <input type="text" value={form.name} onChange={(e) => handleNameChange(e.target.value)} placeholder="e.g. Frontend" className="input-base mt-1" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Short Label</label>
              <input
                type="text"
                value={form.short_label}
                onChange={(e) => setForm((f) => ({ ...f, short_label: e.target.value }))}
                placeholder="e.g. FE"
                maxLength={4}
                className="input-base mt-1 uppercase"
              />
            </div>
          </div>

          <div className="mb-5">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Color</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {CATEGORY_PALETTE.map((p, idx) => (
                <button
                  key={p.name}
                  onClick={() => setForm((f) => ({ ...f, paletteIndex: idx }))}
                  className={`w-8 h-8 rounded-lg border-2 transition-all cursor-pointer ${form.paletteIndex === idx ? 'border-blue-500 scale-105' : 'border-white/0'}`}
                  style={{ backgroundColor: p.hex }}
                  title={p.name}
                />
              ))}
            </div>
          </div>

          <div className="mb-5">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Icon</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {CATEGORY_ICONS.map((iconName) => {
                const IconComponent = ICON_MAP[iconName]
                return (
                  <button
                    key={iconName}
                    onClick={() => setForm((f) => ({ ...f, icon: iconName }))}
                    className={`p-2 rounded-lg border transition-all cursor-pointer ${
                      form.icon === iconName ? 'border-blue-300 bg-blue-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                    title={iconName}
                  >
                    <IconComponent className="w-4 h-4 text-slate-600" />
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1">
              <span className="text-[11px] text-slate-400">Preview: </span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${CATEGORY_PALETTE[form.paletteIndex].color}`}>
                {form.short_label.toUpperCase() || 'LBL'}
              </span>
            </div>
            <button onClick={editingId ? handleUpdate : handleAdd} disabled={!form.name.trim() || !form.short_label.trim()} className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
              {editingId ? 'Update' : 'Create'}
            </button>
            <button onClick={cancelEdit} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const IconComponent = ICON_MAP[cat.icon as keyof typeof ICON_MAP] || Tag
          const breakdown = getStatusBreakdown(cat.id)
          return (
            <div key={cat.id} className={`panel p-5 border-l-4 ${cat.accent}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <IconComponent className="w-4 h-4 text-slate-400" />
                  <h3 className="text-sm font-semibold text-slate-800">{cat.name}</h3>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cat.color}`}>{cat.short_label}</span>
              </div>

              <div className="mb-3">
                <div className="text-xs text-slate-500 mb-1.5">{breakdown.total} tasks</div>
                {breakdown.total > 0 && (
                  <div className="flex gap-3 text-[10px]">
                    <span className="text-slate-400">{breakdown.todo} todo</span>
                    <span className="text-amber-700">{breakdown.inprogress} in progress</span>
                    <span className="text-emerald-700">{breakdown.done} done</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-1">
                <button onClick={() => startEdit(cat)} className="btn btn-ghost !p-2" title="Edit category">
                  <Pencil className="w-4 h-4" />
                </button>
                {deleteConfirm === cat.id ? (
                  <>
                    <button onClick={() => handleDelete(cat.id)} className="btn btn-danger !px-2 !py-1 text-xs">
                      Confirm
                    </button>
                    <button onClick={() => setDeleteConfirm(null)} className="btn btn-secondary !px-2 !py-1 text-xs">
                      Cancel
                    </button>
                  </>
                ) : (
                  <button onClick={() => setDeleteConfirm(cat.id)} className="btn btn-ghost !p-2 text-red-500 hover:bg-red-50" title="Delete category">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
