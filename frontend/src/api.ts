export type User = { id: string; name: string; email: string }
export type Task = { id: string; title: string; description: string; status: 'todo' | 'in_progress' | 'done'; createdAt: string; updatedAt: string }
export type TimeLog = { id: string; taskId: string; startedAt: string; endedAt: string | null }
export type TimeLogEntry = TimeLog & { taskTitle: string; durationSeconds: number }
export type Summary = { totalSeconds: number; tasks: { taskId: string; title: string; seconds: number }[] }

export class ApiError extends Error {
  constructor(message: string, readonly status: number) { super(message) }
}

const base = import.meta.env.VITE_API_URL || '/api'

export async function request<T>(path: string, token?: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: { message?: string } } | null
    throw new ApiError(body?.error?.message || `Request failed (${response.status})`, response.status)
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>
}

export const json = (method: string, body?: object): RequestInit => ({ method, ...(body ? { body: JSON.stringify(body) } : {}) })
