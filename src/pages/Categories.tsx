import { useState } from 'react'
import { useCategories } from '../hooks/useCategories'
import { useAllTasks } from '../hooks/useAllTasks'
import { CATEGORY_PALETTE, CATEGORY_ICONS } from '../lib/constants'
import { Plus, Pencil, Trash2, X, Tag, Code, Cloud, Brain, Database, Globe, Server, Layers, Package, Cpu, Terminal, GitBranch, Book, Lightbulb, Rocket, Shield, Zap, Heart, Star, Target } from 'lucide-react'
import type { Category } from '../types'

const ICON_MAP = {
  tag: Tag, code: Code, cloud: Cloud, brain: Brain, database: Database, globe: Globe,
  server: Server, layers: Layers, package: Package, cpu: Cpu, terminal: Terminal, 'git-branch': GitBranch,
  book: Book, lightbulb: Lightbulb, rocket: Rocket, shield: Shield, zap: Zap, heart: Heart,
  star: Star, target: Target
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

  const taskCountForCategory = (id: string) => tasks.filter((t) => t.category_id === id).length

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
    await deleteCategory(id)
    setDeleteConfirm(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setShowAdd(false)
    setForm(emptyForm)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-3">
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse-soft" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse-soft" style={{ animationDelay: '200ms' }} />
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse-soft" style={{ animationDelay: '400ms' }} />
        </div>
        <span className="text-xs text-slate-400">Loading categories...</span>
      </div>
    )
  }

  return (
    <div className="p-6 lg:pl-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Categories</h1>
          <p className="text-sm text-slate-400 mt-1">Organize your tasks into categories</p>
        </div>
        <button
          onClick={() => { setShowAdd(true); setEditingId(null); setForm(emptyForm) }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 shadow-sm font-medium text-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {/* Add / Edit Form */}
      {(showAdd || editingId) && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700">
              {editingId ? 'Edit Category' : 'New Category'}
            </h3>
            <button onClick={cancelEdit} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-[11px] font-medium text-slate-500">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Frontend"
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-500">Short Label (badge)</label>
              <input
                type="text"
                value={form.short_label}
                onChange={(e) => setForm((f) => ({ ...f, short_label: e.target.value }))}
                placeholder="e.g. FE"
                maxLength={4}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100 uppercase"
              />
            </div>
          </div>

          <div className="mb-5">
            <label className="text-[11px] font-medium text-slate-500">Color</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {CATEGORY_PALETTE.map((p, idx) => (
                <button
                  key={p.name}
                  onClick={() => setForm((f) => ({ ...f, paletteIndex: idx }))}
                  className={`w-8 h-8 rounded-lg border-2 transition-all cursor-pointer ${
                    form.paletteIndex === idx ? 'border-indigo-500 scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: p.hex }}
                  title={p.name}
                />
              ))}
            </div>
          </div>

          <div className="mb-5">
            <label className="text-[11px] font-medium text-slate-500">Icon</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {CATEGORY_ICONS.map((iconName) => {
                const IconComponent = ICON_MAP[iconName]
                return (
                  <button
                    key={iconName}
                    onClick={() => setForm((f) => ({ ...f, icon: iconName }))}
                    className={`p-2 rounded-lg border-2 transition-all cursor-pointer ${
                      form.icon === iconName
                        ? 'border-indigo-500 bg-indigo-50 scale-110'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
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
            <button
              onClick={editingId ? handleUpdate : handleAdd}
              disabled={!form.name.trim() || !form.short_label.trim()}
              className="px-4 py-2 bg-indigo-500 text-white text-sm rounded-lg hover:bg-indigo-600 font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editingId ? 'Update' : 'Create'}
            </button>
            <button
              onClick={cancelEdit}
              className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Category List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const IconComponent = ICON_MAP[cat.icon as keyof typeof ICON_MAP] || Tag
          const breakdown = getStatusBreakdown(cat.id)
          return (
            <div
              key={cat.id}
              className={`bg-white rounded-xl border border-slate-200 shadow-sm p-5 border-l-4 ${cat.accent} hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <IconComponent className="w-4 h-4 text-slate-400" />
                  <h3 className="text-sm font-semibold text-slate-700">{cat.name}</h3>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cat.color}`}>
                  {cat.short_label}
                </span>
              </div>

              <div className="mb-3">
                <div className="text-xs text-slate-500 mb-1.5">{breakdown.total} tasks</div>
                {breakdown.total > 0 && (
                  <div className="flex gap-3 text-[10px]">
                    <span className="text-slate-400">{breakdown.todo} todo</span>
                    <span className="text-amber-600">{breakdown.inprogress} in progress</span>
                    <span className="text-emerald-600">{breakdown.done} done</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1" />
                <div className="flex items-center gap-1">
                <button
                  onClick={() => startEdit(cat)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 cursor-pointer"
                  title="Edit"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                {deleteConfirm === cat.id ? (
                  <div className="flex items-center gap-1 ml-1">
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="text-[10px] px-2 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 cursor-pointer"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="text-[10px] px-2 py-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(cat.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
          )
        })}
      </div>

      {categories.length === 0 && !showAdd && (
        <div className="text-center py-20">
          <Tag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">No categories yet</h3>
          <p className="text-sm text-slate-400 mb-6">Create your first category to start organizing your tasks</p>
          <button
            onClick={() => { setShowAdd(true); setEditingId(null); setForm(emptyForm) }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 shadow-sm font-medium text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        </div>
      )}
    </div>
  )
}
