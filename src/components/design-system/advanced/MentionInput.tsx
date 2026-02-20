import { useMemo } from 'react'
import type { TextareaHTMLAttributes } from 'react'
import { Textarea } from '../atoms'

export interface MentionInputProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'> {
  mentions: string[]
  value: string
  onValueChange: (value: string) => void
}

export function MentionInput({ mentions, value, onValueChange, ...props }: MentionInputProps) {
  const match = value.match(/@([\w-]*)$/)

  const options = useMemo(() => {
    if (!match) return []
    const query = (match[1] ?? '').toLowerCase()
    return mentions.filter((name) => name.toLowerCase().includes(query)).slice(0, 5)
  }, [match, mentions])

  const applyMention = (mention: string) => {
    onValueChange(value.replace(/@([\w-]*)$/, `@${mention} `))
  }

  return (
    <div className="relative">
      <Textarea value={value} onChange={(event) => onValueChange(event.target.value)} {...props} />
      {match && options.length > 0 ? (
        <ul className="absolute left-2 top-[calc(100%+6px)] z-20 w-44 rounded-[var(--radius-sm)] border border-[var(--border)] bg-white p-1 shadow-[var(--shadow-dropdown)]">
          {options.map((option) => (
            <li key={option}>
              <button
                type="button"
                className="w-full rounded-[var(--radius-xs)] px-2 py-1.5 text-left text-sm hover:bg-slate-100"
                onClick={() => applyMention(option)}
              >
                @{option}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
