import { Alert } from './Alert'

export interface SuccessStateProps {
  title?: string
  message: string
}

export function SuccessState({ title = 'Success', message }: SuccessStateProps) {
  return <Alert title={title} variant="success">{message}</Alert>
}
