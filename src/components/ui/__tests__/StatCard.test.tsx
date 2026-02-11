import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatCard } from '../StatCard'
import { ListTodo } from 'lucide-react'

describe('StatCard', () => {
  it('renders title and numeric value', () => {
    render(<StatCard title="Total Tasks" value={42} icon={ListTodo} iconColor="bg-indigo-50 text-indigo-600" />)
    expect(screen.getByText('Total Tasks')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('renders string value', () => {
    render(<StatCard title="Status" value="Active" icon={ListTodo} iconColor="bg-indigo-50 text-indigo-600" />)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('renders zero value', () => {
    render(<StatCard title="Done" value={0} icon={ListTodo} iconColor="bg-emerald-50 text-emerald-600" />)
    expect(screen.getByText('0')).toBeInTheDocument()
  })
})
