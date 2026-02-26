import { useMemo, useState } from 'react'
import type { Proposal, ProposedReschedule, ProposedTask } from '../../types'

interface AIConfirmationPanelProps {
  proposal: Proposal
  onConfirm: (proposal: Proposal) => Promise<void>
  onCancel: () => void
}

function isTaskProposal(proposal: Proposal): proposal is Proposal & { items: ProposedTask[] } {
  return proposal.proposal_type === 'create_tasks'
}

function isRescheduleProposal(proposal: Proposal): proposal is Proposal & { items: ProposedReschedule[] } {
  return proposal.proposal_type === 'reschedule_tasks'
}

export function AIConfirmationPanel({ proposal, onConfirm, onCancel }: AIConfirmationPanelProps) {
  const [submitting, setSubmitting] = useState(false)
  const [selected, setSelected] = useState<boolean[]>(proposal.items.map(() => true))
  const [draftProposal, setDraftProposal] = useState<Proposal>(proposal)

  const selectedCount = useMemo(() => selected.filter(Boolean).length, [selected])

  async function handleConfirm() {
    if (submitting) return
    setSubmitting(true)

    try {
      if (draftProposal.proposal_type === 'create_tasks') {
        const filteredItems = (draftProposal.items as ProposedTask[]).filter((_, index) => selected[index])
        await onConfirm({
          ...draftProposal,
          items: filteredItems,
        })
      } else {
        const filteredItems = (draftProposal.items as ProposedReschedule[]).filter((_, index) => selected[index])
        await onConfirm({
          ...draftProposal,
          items: filteredItems,
        })
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4 mt-3">
      <p className="text-sm font-semibold text-blue-800">✦ {proposal.summary || 'AI generated a proposal'}</p>

      <div className="mt-3 space-y-2">
        {isTaskProposal(draftProposal) && draftProposal.items.map((item, index) => (
          <div key={`task-${index}`} className="rounded-xl border border-blue-100 bg-white px-3 py-2">
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={selected[index]}
                onChange={() => setSelected((prev) => prev.map((value, i) => (i === index ? !value : value)))}
                className="mt-1"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800">{item.title}</p>
                <div className="mt-1 grid grid-cols-1 gap-2 md:grid-cols-2">
                  <input
                    type="date"
                    value={item.date ?? ''}
                    onChange={(event) => {
                      const date = event.target.value || null
                      setDraftProposal((prev) => ({
                        ...prev,
                        items: (prev.items as ProposedTask[]).map((value, i) => (i === index ? { ...value, date } : value)),
                      }))
                    }}
                    className="h-8 rounded-lg border border-slate-300 px-2 text-xs"
                  />
                  <input
                    type="time"
                    value={item.time ?? ''}
                    onChange={(event) => {
                      const time = event.target.value || null
                      setDraftProposal((prev) => ({
                        ...prev,
                        items: (prev.items as ProposedTask[]).map((value, i) => (i === index ? { ...value, time } : value)),
                      }))
                    }}
                    className="h-8 rounded-lg border border-slate-300 px-2 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}

        {isRescheduleProposal(draftProposal) && draftProposal.items.map((item, index) => (
          <div key={`reschedule-${index}`} className="rounded-xl border border-blue-100 bg-white px-3 py-2">
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={selected[index]}
                onChange={() => setSelected((prev) => prev.map((value, i) => (i === index ? !value : value)))}
                className="mt-1"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800">{item.task_title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{item.reason}</p>
                <div className="mt-1 grid grid-cols-1 gap-2 md:grid-cols-2">
                  <input
                    type="date"
                    value={item.new_date ?? ''}
                    onChange={(event) => {
                      const new_date = event.target.value || undefined
                      setDraftProposal((prev) => ({
                        ...prev,
                        items: (prev.items as ProposedReschedule[]).map((value, i) => (i === index ? { ...value, new_date } : value)),
                      }))
                    }}
                    className="h-8 rounded-lg border border-slate-300 px-2 text-xs"
                  />
                  <input
                    type="time"
                    value={item.new_time ?? ''}
                    onChange={(event) => {
                      const new_time = event.target.value || undefined
                      setDraftProposal((prev) => ({
                        ...prev,
                        items: (prev.items as ProposedReschedule[]).map((value, i) => (i === index ? { ...value, new_time } : value)),
                      }))
                    }}
                    className="h-8 rounded-lg border border-slate-300 px-2 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="h-9 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-600"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => void handleConfirm()}
          disabled={submitting || selectedCount === 0}
          className="h-9 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white disabled:opacity-60"
        >
          {submitting ? 'Applying...' : 'Confirm checked'}
        </button>
      </div>
    </section>
  )
}
