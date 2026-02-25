import type { TaskStatus } from '../types'

export const countLabel = (count: number) => `${count} ${count === 1 ? 'task' : 'tasks'}`

export const statusLabel = (status: TaskStatus) =>
  (status === 'done' ? 'Done' : status === 'inprogress' ? 'In Progress' : 'To Do')

