export type TaskMutationKind =
  | 'insert'
  | 'update'
  | 'delete'
  | 'bulk_update'
  | 'bulk_delete'

export interface TaskMutationRecord {
  id?: number
  kind: TaskMutationKind
  payload: Record<string, unknown>
  createdAt: number
}

const DB_NAME = 'tasky-offline'
const DB_VERSION = 1
const STORE_NAME = 'task_mutations'

function isClient() {
  return typeof window !== 'undefined' && typeof indexedDB !== 'undefined'
}

function openDb(): Promise<IDBDatabase | null> {
  if (!isClient()) return Promise.resolve(null)

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
      }
    }
  })
}

export async function enqueueTaskMutation(record: Omit<TaskMutationRecord, 'id' | 'createdAt'>) {
  const db = await openDb()
  if (!db) return

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.onerror = () => reject(tx.error)
    tx.oncomplete = () => resolve()
    tx.objectStore(STORE_NAME).add({ ...record, createdAt: Date.now() } satisfies TaskMutationRecord)
  })
}

export async function listTaskMutations(): Promise<TaskMutationRecord[]> {
  const db = await openDb()
  if (!db) return []

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const request = tx.objectStore(STORE_NAME).getAll()
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const rows = (request.result as TaskMutationRecord[]).sort((a, b) => a.createdAt - b.createdAt)
      resolve(rows)
    }
  })
}

export async function removeTaskMutation(id: number) {
  const db = await openDb()
  if (!db) return

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.onerror = () => reject(tx.error)
    tx.oncomplete = () => resolve()
    tx.objectStore(STORE_NAME).delete(id)
  })
}

export async function clearTaskMutations() {
  const db = await openDb()
  if (!db) return

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.onerror = () => reject(tx.error)
    tx.oncomplete = () => resolve()
    tx.objectStore(STORE_NAME).clear()
  })
}
