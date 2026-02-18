import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '../ProtectedRoute'

// Mock useAuth to control auth state
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

import { useAuth } from '../../../contexts/AuthContext'
const mockUseAuth = vi.mocked(useAuth)

describe('ProtectedRoute', () => {
  it('shows loading state when auth is loading', () => {
    mockUseAuth.mockReturnValue({
      authenticated: false,
      loading: true,
      user: null,
      signInWithGoogle: async () => {},
      signOut: async () => {},
    })

    const { container } = render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/protected" element={<div>Protected Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    expect(container.querySelector('.animate-pulse-soft')).toBeInTheDocument()
  })

  it('redirects to /welcome when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      authenticated: false,
      loading: false,
      user: null,
      signInWithGoogle: async () => {},
      signOut: async () => {},
    })

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/protected" element={<div>Protected Content</div>} />
          </Route>
          <Route path="/welcome" element={<div>Welcome Page</div>} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    expect(screen.getByText('Welcome Page')).toBeInTheDocument()
  })

  it('renders outlet content when authenticated', () => {
    mockUseAuth.mockReturnValue({
      authenticated: true,
      loading: false,
      user: { id: '1', email: 'test@example.com' } as any,
      signInWithGoogle: async () => {},
      signOut: async () => {},
    })

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/protected" element={<div>Protected Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })
})
