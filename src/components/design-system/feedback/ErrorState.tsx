import { Alert } from './Alert'

export interface ErrorStateProps {
  title?: string
  message: string
}

export function ErrorState({ title = 'Something went wrong', message }: ErrorStateProps) {
  return <Alert title={title} variant="error">{message}</Alert>
}
