import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from '../AuthContext'

// Mock import.meta.env
vi.stubEnv('VITE_ADMIN_PIN', '123456')

function TestConsumer() {
  const { authenticated, loading, signIn, signOut } = useAuth()
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="authenticated">{String(authenticated)}</span>
      <button onClick={() => signIn('123456')}>Sign In Correct</button>
      <button onClick={() => signIn('wrong')}>Sign In Wrong</button>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('starts unauthenticated when localStorage is empty', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )
    // After useEffect runs, loading should be false
    expect(await screen.findByTestId('authenticated')).toHaveTextContent('false')
  })

  it('restores authenticated state from localStorage', async () => {
    localStorage.setItem('tasky_authenticated', 'true')
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )
    expect(await screen.findByTestId('authenticated')).toHaveTextContent('true')
  })

  it('signIn with correct PIN sets authenticated to true', async () => {
    const user = userEvent.setup()
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )
    await screen.findByTestId('authenticated') // wait for initial load
    await user.click(screen.getByText('Sign In Correct'))
    expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
    expect(localStorage.getItem('tasky_authenticated')).toBe('true')
  })

  it('signIn with wrong PIN keeps authenticated false', async () => {
    const user = userEvent.setup()
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )
    await screen.findByTestId('authenticated')
    await user.click(screen.getByText('Sign In Wrong'))
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
  })

  it('signOut clears authentication', async () => {
    const user = userEvent.setup()
    localStorage.setItem('tasky_authenticated', 'true')
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )
    await screen.findByTestId('authenticated')
    await user.click(screen.getByText('Sign Out'))
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
    expect(localStorage.getItem('tasky_authenticated')).toBeNull()
  })
})
