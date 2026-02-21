import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from '../AuthContext'

// Mock supabase
const mockGetSession = vi.fn()
const mockSignInWithOAuth = vi.fn()
const mockSignOut = vi.fn()
const mockOnAuthStateChange = vi.fn()

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      signInWithOAuth: (opts: unknown) => mockSignInWithOAuth(opts),
      signOut: () => mockSignOut(),
      onAuthStateChange: (cb: unknown) => {
        mockOnAuthStateChange(cb)
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      },
    },
  },
}))

function TestConsumer() {
  const { authenticated, loading, user, signInWithGoogle, signOut } = useAuth()
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="authenticated">{String(authenticated)}</span>
      <span data-testid="user">{user?.email ?? 'none'}</span>
      <button onClick={() => signInWithGoogle()}>Sign In Google</button>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue({ data: { session: null } })
    mockSignInWithOAuth.mockResolvedValue({ data: {}, error: null })
    mockSignOut.mockResolvedValue({ error: null })
  })

  it('starts unauthenticated when no session exists', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )
    expect(await screen.findByTestId('authenticated')).toHaveTextContent('false')
    expect(screen.getByTestId('user')).toHaveTextContent('none')
  })

  it('restores authenticated state from existing session', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: '1', email: 'test@example.com' } } },
    })
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )
    expect(await screen.findByTestId('authenticated')).toHaveTextContent('true')
    expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
  })

  it('calls signInWithOAuth with google provider', async () => {
    const user = userEvent.setup()
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )
    await screen.findByTestId('authenticated')
    await user.click(screen.getByText('Sign In Google'))
    expect(mockSignInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'google',
        options: expect.objectContaining({
          redirectTo: expect.stringContaining('/dashboard'),
        }),
      })
    )
  })

  it('signOut calls supabase signOut', async () => {
    const user = userEvent.setup()
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: '1', email: 'test@example.com' } } },
    })
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )
    await screen.findByTestId('authenticated')
    await user.click(screen.getByText('Sign Out'))
    expect(mockSignOut).toHaveBeenCalled()
  })
})
