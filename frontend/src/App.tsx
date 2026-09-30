import { useCallback, useEffect, useLayoutEffect, useState, type FormEvent, type ReactNode } from 'react'
import { BarChart3, Check, CheckSquare, Clock3, LogOut, Moon, Pencil, Plus, Sun, Trash2, X } from 'lucide-react'
import { ApiError, json, request, type Summary, type Task, type TimeLog, type TimeLogEntry, type User } from './api'

type Session = { token: string; user: User }
type View = 'tasks' | 'logs' | 'summary'
const statusLabel = { todo: 'To do', in_progress: 'In progress', done: 'Done' }

function seconds(value: number) {
  const total = Math.max(0, Math.floor(value))
  return `${String(Math.floor(total / 3600)).padStart(2, '0')}:${String(Math.floor(total / 60) % 60).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

function localDay(date: Date) {
  const from = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const to = new Date(from)
  to.setDate(to.getDate() + 1)
  return { from: from.toISOString(), to: to.toISOString() }
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return <button type="button" aria-label={label} title={label} onClick={onClick} className="rounded-lg p-2 text-muted hover:bg-ink/5 hover:text-accent">{children}</button>
}

function Auth({ onSuccess, themeButton }: { onSuccess: (session: Session) => void; themeButton: ReactNode }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setBusy(true)
    setError('')
    try {
      const session = await request<Session>(`/auth/${mode}`, undefined, json('POST', Object.fromEntries(data)))
      onSuccess(session)
    } catch (cause) { setError((cause as Error).message) }
    finally { setBusy(false) }
  }
  return <main className="flex min-h-screen items-center justify-center p-5">
    <div className="card w-full max-w-md p-7 sm:p-10">
      <div className="mb-9 flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-red-400" /><span className="h-3 w-3 rounded-full bg-amber-400" /><span className="h-3 w-3 rounded-full bg-emerald-400" /><span className="ml-auto">{themeButton}</span></div>
      <h1 className="text-center text-2xl font-bold tracking-tight">Task and Time Tracker</h1>
      <p className="mt-2 text-center text-sm text-muted">Stay focused. See where your time goes.</p>
      <div className="mt-9 grid grid-cols-2 gap-3" role="tablist" aria-label="Account">
        {(['login', 'signup'] as const).map(item => <button key={item} type="button" role="tab" aria-selected={mode === item} onClick={() => { setMode(item); setError('') }} className={`rounded-xl py-3 text-sm font-semibold ${mode === item ? 'text-accent shadow-raised' : 'text-muted'}`}>{item === 'login' ? 'Login' : 'Sign up'}</button>)}
      </div>
      <form onSubmit={submit} className="mt-8 space-y-4">
        {mode === 'signup' && <input className="field" name="name" placeholder="Your name" autoComplete="name" required />}
        <input className="field" name="email" type="email" placeholder="you@example.com" autoComplete="email" required />
        <input className="field" name="password" type="password" placeholder="Password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={mode === 'signup' ? 8 : undefined} required />
        {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}
        <button disabled={busy} className="button button-primary w-full">{busy ? 'Please wait…' : mode === 'login' ? 'Login' : 'Create account'}</button>
      </form>
    </div>
  </main>
}

function TaskDialog({ task, close, save }: { task: Task; close: () => void; save: (values: { title: string; description: string; status: Task['status'] }) => Promise<void> }) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setBusy(true)
    try { await save({ title: String(data.get('title')).trim(), description: String(data.get('description')).trim(), status: data.get('status') as Task['status'] }); close() }
    catch (cause) { setError((cause as Error).message) }
    finally { setBusy(false) }
  }
  return <div className="fixed inset-0 z-20 flex items-center justify-center bg-ink/25 p-4" onMouseDown={event => { if (event.target === event.currentTarget) close() }}>
    <form onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="edit-title" className="card w-full max-w-md p-7">
      <div className="flex items-center justify-between"><h2 id="edit-title" className="text-xl font-bold">Edit Task</h2><IconButton label="Close" onClick={close}><X size={18} /></IconButton></div>
      <label className="mt-6 block text-sm font-semibold">Title<input className="field mt-2" name="title" defaultValue={task.title} maxLength={200} required autoFocus /></label>
      <label className="mt-5 block text-sm font-semibold">Description<textarea className="field mt-2 min-h-28 resize-y" name="description" defaultValue={task.description} /></label>
      <label className="mt-5 block text-sm font-semibold">Status<select className="field mt-2" name="status" defaultValue={task.status}><option value="todo">To do</option><option value="in_progress">In progress</option><option value="done">Done</option></select></label>
      {error && <p role="alert" className="mt-4 text-sm text-red-700 dark:text-red-300">{error}</p>}
      <div className="mt-7 flex justify-end gap-3"><button type="button" className="button" onClick={close}>Cancel</button><button disabled={busy} className="button button-primary">Save</button></div>
    </form>
  </div>
}

function Tasks({ tasks, active, elapsed, create, update, remove, start, stop }: {
  tasks: Task[]; active: TimeLog | null; elapsed: number; create: (title: string, description?: string) => Promise<void>; update: (task: Task, values: object) => Promise<void>; remove: (task: Task) => Promise<void>; start: (task: Task) => Promise<void>; stop: () => Promise<void>
}) {
  const [input, setInput] = useState('')
  const [editing, setEditing] = useState<Task | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function add(event: FormEvent) {
    event.preventDefault()
    if (!input.trim()) return
    setBusy(true); setError('')
    try { await create(input.trim()); setInput('') }
    catch (cause) { setError((cause as Error).message) }
    finally { setBusy(false) }
  }
  return <section>
    <div className="mb-6"><h1 className="text-2xl font-bold">Tasks</h1><p className="mt-1 text-sm text-muted">Keep your work moving, one task at a time.</p></div>
    <form onSubmit={add} className="card flex flex-wrap gap-3 p-3"><input className="field min-w-52 flex-1" value={input} onChange={event => setInput(event.target.value)} placeholder="Add a new task..." aria-label="New task" /><button disabled={busy || !input.trim()} className="button button-primary"><Plus size={17} /> Add</button></form>
    {error && <p role="alert" className="mt-4 text-sm text-red-700 dark:text-red-300">{error}</p>}
    <div className="card mt-6 overflow-hidden">
      {tasks.length === 0 ? <p className="p-10 text-center text-muted">No tasks yet. Add your first task above.</p> : tasks.map(task => <div key={task.id} className="flex flex-wrap items-center gap-3 border-b border-ink/10 px-4 py-4 last:border-0 sm:px-6">
        <button type="button" aria-label={`Mark ${task.title} ${task.status === 'done' ? 'to do' : 'done'}`} onClick={() => update(task, { status: task.status === 'done' ? 'todo' : 'done' })} className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border border-ink/20 bg-surface shadow-raised ${task.status === 'done' ? 'text-accent' : ''}`}>{task.status === 'done' && <Check size={14} />}</button>
        <div className="min-w-0 flex-1 basis-40"><p className={`truncate text-sm font-medium ${task.status === 'done' ? 'text-muted line-through' : ''}`}>{task.title}</p>{task.description && <p className="truncate text-xs text-muted">{task.description}</p>}</div>
        <span className={`pill ${task.status === 'in_progress' ? 'text-accent' : task.status === 'done' ? 'text-emerald-700 dark:text-emerald-300' : 'text-muted'}`}>{statusLabel[task.status]}</span>
        <span className={`w-20 text-right font-mono text-xs tabular-nums ${active?.taskId === task.id ? 'font-semibold text-accent' : 'text-muted'}`}>{active?.taskId === task.id ? seconds(elapsed) : ''}</span>
        <button type="button" disabled={!!active && active.taskId !== task.id || task.status === 'done'} onClick={() => active?.taskId === task.id ? stop() : start(task)} className={`button min-w-20 py-2 text-xs ${active?.taskId === task.id ? 'button-primary' : ''}`}>{active?.taskId === task.id ? 'Stop' : 'Start'}</button>
        <IconButton label={`Edit ${task.title}`} onClick={() => setEditing(task)}><Pencil size={16} /></IconButton>
        <IconButton label={`Delete ${task.title}`} onClick={() => { if (window.confirm(`Delete “${task.title}”?`)) remove(task) }}><Trash2 size={16} /></IconButton>
      </div>)}
    </div>
    {editing && <TaskDialog task={editing} close={() => setEditing(null)} save={values => update(editing, values)} />}
  </section>
}

function SummaryView({ summary, tasks, date, setDate }: { summary: Summary | null; tasks: Task[]; date: string; setDate: (date: string) => void }) {
  const completed = tasks.filter(task => task.status === 'done').length
  const active = tasks.filter(task => task.status === 'in_progress').length
  return <section><div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-2xl font-bold">Daily Summary</h1><p className="mt-1 text-sm text-muted">A clear view of your progress.</p></div><input type="date" className="field w-auto" value={date} onChange={event => setDate(event.target.value)} aria-label="Summary date" /></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[['Time tracked', seconds(summary?.totalSeconds || 0)], ['Completed', completed], ['In progress', active], ['Pending', tasks.length - completed - active]].map(([label, value]) => <div className="card p-5" key={label}><p className="text-sm text-muted">{label}</p><p className="mt-3 text-2xl font-bold">{value}</p></div>)}</div>
    <div className="card mt-6 p-6"><h2 className="text-lg font-bold">Time by task</h2>{summary?.tasks.length ? <div className="mt-5 space-y-5">{summary.tasks.map(item => <div key={item.taskId}><div className="mb-2 flex justify-between gap-4 text-sm"><span>{item.title}</span><span className="font-mono text-muted">{seconds(item.seconds)}</span></div><div className="h-2 rounded-full bg-surface shadow-inset"><div className="h-2 rounded-full bg-accent" style={{ width: `${Math.max(2, item.seconds / summary.totalSeconds * 100)}%` }} /></div></div>)}</div> : <p className="mt-5 text-sm text-muted">No time tracked on this day.</p>}</div>
  </section>
}

function Logs({ date, setDate, list }: { date: string; setDate: (date: string) => void; list: (offset: number) => Promise<TimeLogEntry[]> }) {
  const [logs, setLogs] = useState<TimeLogEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    let current = true
    setLogs([]); setLoading(true); setError('')
    void list(0).then(rows => { if (current) { setLogs(rows); setHasMore(rows.length === 20) } }).catch(cause => { if (current) setError(cause.message) }).finally(() => { if (current) setLoading(false) })
    return () => { current = false }
  }, [list])
  async function more() {
    setLoading(true); setError('')
    try { const rows = await list(logs.length); setLogs([...logs, ...rows]); setHasMore(rows.length === 20) }
    catch (cause) { setError((cause as Error).message) }
    finally { setLoading(false) }
  }
  return <section><div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-2xl font-bold">Time Logs</h1><p className="mt-1 text-sm text-muted">Review where your time went.</p></div><input type="date" className="field w-auto" value={date} onChange={event => setDate(event.target.value)} aria-label="Log date" /></div>
    <div className="card overflow-x-auto p-3"><table className="w-full min-w-[620px] text-left text-sm"><thead className="text-muted"><tr>{['Task', 'Date', 'Start', 'End', 'Total time'].map(label => <th className="px-4 py-4 font-semibold" key={label}>{label}</th>)}</tr></thead><tbody>{logs.length ? logs.map(log => { const start = new Date(log.startedAt); return <tr className="border-t border-ink/10" key={log.id}><td className="px-4 py-4 font-medium">{log.taskTitle}</td><td className="px-4 py-4 text-muted">{start.toLocaleDateString()}</td><td className="px-4 py-4 text-muted">{start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td><td className="px-4 py-4 text-muted">{log.endedAt ? new Date(log.endedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Running'}</td><td className="px-4 py-4 font-mono text-muted">{seconds(log.durationSeconds)}</td></tr> }) : <tr><td colSpan={5} className="px-4 py-10 text-center text-muted">{loading ? 'Loading…' : 'No time logs for this day.'}</td></tr>}</tbody></table></div>
    {error && <p role="alert" className="mt-4 text-sm text-red-700 dark:text-red-300">{error}</p>}
    {hasMore && <button type="button" className="button mt-5" disabled={loading} onClick={more}>{loading ? 'Loading…' : 'Load more'}</button>}
  </section>
}

export default function App() {
  const [dark, setDark] = useState(() => localStorage.getItem('tracker-theme') === 'dark')
  useLayoutEffect(() => { document.documentElement.classList.toggle('dark', dark); localStorage.setItem('tracker-theme', dark ? 'dark' : 'light') }, [dark])
  const themeButton = <IconButton label={dark ? 'Use light theme' : 'Use dark theme'} onClick={() => setDark(!dark)}>{dark ? <Sun size={17} /> : <Moon size={17} />}</IconButton>
  const [session, setSession] = useState<Session | null>(() => { try { return JSON.parse(localStorage.getItem('tracker-session') || 'null') as Session | null } catch { return null } })
  const [view, setView] = useState<View>('tasks')
  const [tasks, setTasks] = useState<Task[]>([])
  const [active, setActive] = useState<TimeLog | null>(null)
  const [serverOffset, setServerOffset] = useState(0)
  const [tick, setTick] = useState(Date.now())
  const [date, setDate] = useState(() => new Date().toLocaleDateString('en-CA'))
  const [summary, setSummary] = useState<Summary | null>(null)
  const [error, setError] = useState('')
  const token = session?.token
  const logout = useCallback(() => { localStorage.removeItem('tracker-session'); setSession(null); setTasks([]); setActive(null) }, [])
  const call = useCallback(async <T,>(path: string, options?: RequestInit) => {
    try { return await request<T>(path, token, options) }
    catch (cause) { if (cause instanceof ApiError && cause.status === 401) logout(); throw cause }
  }, [token, logout])
  const load = useCallback(async () => {
    if (!token) return
    try {
      const [user, taskList, timer] = await Promise.all([call<User>('/auth/me'), call<Task[]>('/tasks'), call<{ timeLog: TimeLog | null; now: string }>('/timer/active')])
      setSession({ token, user }); setTasks(taskList); setActive(timer.timeLog); setTick(Date.now()); setServerOffset(new Date(timer.now).getTime() - Date.now()); setError('')
    } catch (cause) { if (!(cause instanceof ApiError && cause.status === 401)) setError((cause as Error).message) }
  }, [token, call])
  useEffect(() => { void load() }, [load])
  useEffect(() => { if (!active) return; const id = window.setInterval(() => setTick(Date.now()), 1000); return () => clearInterval(id) }, [active])
  useEffect(() => {
    if (!token) return
    const { from, to } = localDay(new Date(`${date}T12:00:00`))
    const query = new URLSearchParams({ from, to })
    void call<Summary>(`/summary?${query}`).then(setSummary).catch(cause => setError(cause.message))
  }, [token, date, call, active])
  const refresh = async () => { await load(); const { from, to } = localDay(new Date(`${date}T12:00:00`)); await call<Summary>(`/summary?${new URLSearchParams({ from, to })}`).then(setSummary) }
  const listLogs = useCallback((offset: number) => {
    const { from, to } = localDay(new Date(`${date}T12:00:00`))
    return call<TimeLogEntry[]>(`/time-logs?${new URLSearchParams({ from, to, limit: '20', offset: String(offset) })}`)
  }, [date, call])
  const action = async (work: () => Promise<unknown>) => { try { setError(''); await work(); await refresh() } catch (cause) { setError((cause as Error).message) } }
  const elapsed = active ? (tick + serverOffset - new Date(active.startedAt).getTime()) / 1000 : 0
  if (!session) return <Auth themeButton={themeButton} onSuccess={value => { localStorage.setItem('tracker-session', JSON.stringify(value)); setSession(value) }} />
  return <div className="min-h-screen p-3 sm:p-6 lg:p-10"><div className="card mx-auto min-h-[min(750px,calc(100vh-80px))] max-w-7xl overflow-hidden">
    <header className="flex h-16 items-center justify-between border-b border-ink/10 px-5 sm:px-7"><div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-red-400" /><span className="h-3 w-3 rounded-full bg-amber-400" /><span className="h-3 w-3 rounded-full bg-emerald-400" /></div><strong className="text-sm tracking-tight">Task and Time Tracker</strong><div className="flex items-center gap-2"><span className="hidden text-xs text-muted sm:inline">{session.user.name}</span>{themeButton}<IconButton label="Log out" onClick={logout}><LogOut size={17} /></IconButton></div></header>
    <div className="flex flex-col md:min-h-[680px] md:flex-row"><nav aria-label="Main navigation" className="flex gap-1 border-b border-ink/10 p-3 md:w-52 md:shrink-0 md:flex-col md:border-b-0 md:border-r md:p-5">{([['tasks', CheckSquare, 'Tasks'], ['logs', Clock3, 'Time Logs'], ['summary', BarChart3, 'Summary']] as const).map(([key, Icon, label]) => <button key={key} onClick={() => setView(key)} className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-3 text-xs font-semibold md:flex-none md:justify-start ${view === key ? 'bg-action text-white shadow-raised' : 'text-muted hover:text-ink'}`}><Icon size={17} />{label}</button>)}</nav>
      <main className="min-w-0 flex-1 p-5 sm:p-8 lg:p-10">{error && <div role="alert" className="mb-5 flex items-center justify-between rounded-xl bg-red-100 px-4 py-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">{error}<button onClick={() => setError('')} aria-label="Dismiss error"><X size={16} /></button></div>}
        {view === 'tasks' && <Tasks tasks={tasks} active={active} elapsed={elapsed} create={async (title, description) => { await call('/tasks', json('POST', { title, description })); await refresh() }} update={async (task, values) => { await call(`/tasks/${task.id}`, json('PATCH', values)); await refresh() }} remove={task => action(() => call(`/tasks/${task.id}`, { method: 'DELETE' }))} start={task => action(() => call(`/tasks/${task.id}/timer/start`, { method: 'POST' }))} stop={() => action(() => call('/timer/stop', { method: 'POST' }))} />}
        {view === 'logs' && <Logs date={date} setDate={setDate} list={listLogs} />}
        {view === 'summary' && <SummaryView summary={summary} tasks={tasks} date={date} setDate={setDate} />}
      </main>
    </div>
  </div></div>
}
