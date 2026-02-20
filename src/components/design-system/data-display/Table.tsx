import type { ReactNode } from 'react'

export interface TableColumn<TData> {
  key: keyof TData
  header: string
  render?: (row: TData) => ReactNode
}

export interface TableProps<TData extends Record<string, unknown>> {
  columns: Array<TableColumn<TData>>
  rows: TData[]
  rowKey: (row: TData, index: number) => string
}

export function Table<TData extends Record<string, unknown>>({ columns, rows, rowKey }: TableProps<TData>) {
  return (
    <div className="overflow-auto rounded-[var(--radius-md)] border border-[var(--border)]">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-slate-50 text-left text-[var(--text-muted)]">
          <tr>
            {columns.map((column) => (
              <th key={String(column.key)} className="px-3 py-2 font-medium">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={rowKey(row, index)} className="border-t border-[var(--border)]">
              {columns.map((column) => (
                <td key={String(column.key)} className="px-3 py-2 text-[var(--text)]">
                  {column.render ? column.render(row) : String(row[column.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
