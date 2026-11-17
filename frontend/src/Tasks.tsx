
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Plus, Search, ListTodo, Trash2, Pencil, X, Save,
  RefreshCw, CalendarDays, CheckCircle2, AlertCircle,
  Clock3, Circle, Filter
} from 'lucide-react'
import api from './api'

type TaskStatus = 'Pending' | 'In Progress' | 'Completed'

interface Task {
  id: number
  title: string
  description?: string | null
  category: string
  priority: string
  status: string
  due_date?: string | null
  created_at: string
  updated_at?: string | null
}

function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [editingId, setEditingId] = useState<number | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState('')
  const [status, setStatus] = useState<TaskStatus>('Pending')
  const [dueDate, setDueDate] = useState('')

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get<Task[]>('/tasks/')
      setTasks(response.data)
      setError('')
    } catch {
      setError('Could not load tasks. Check that your backend is running.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const resetEditor = () => {
    setEditingId(null)
    setTitle('')
    setDescription('')
    setCategory('')
    setPriority('')
    setStatus('Pending')
    setDueDate('')
  }

  const editTask = (task: Task) => {
    setEditingId(task.id)
    setTitle(task.title)
    setDescription(task.description || '')
    setCategory(task.category || '')
    setPriority(task.priority || '')
    setStatus(
      task.status === 'Completed' || task.status === 'In Progress'
        ? task.status
        : 'Pending'
    )
    setDueDate(
      task.due_date
        ? new Date(task.due_date).toISOString().slice(0, 16)
        : ''
    )
    setError('')
    setMessage('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const saveTask = async () => {
    if (!title.trim()) {
      setError('Please enter a task title.')
      return
    }

    try {
      setSaving(true)
      setError('')

      const payload: {
        title: string
        description: string | null
        category?: string
        priority?: string
        status: string
        due_date: string | null
      } = {
        title: title.trim(),
        description: description.trim() || null,
        status,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
      }

      // For new tasks, leave category and priority to the backend
      // ML classifier unless the student explicitly selects them.
      if (category.trim()) payload.category = category
      if (priority.trim()) payload.priority = priority

      if (editingId !== null) {
        await api.put(`/tasks/${editingId}`, payload)
        setMessage('Task updated successfully.')
      } else {
        await api.post('/tasks/', payload)
        setMessage('Task created successfully.')
      }

      resetEditor()
      await fetchTasks()
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const response = (
          err as { response?: { data?: { detail?: string } } }
        ).response
        setError(response?.data?.detail || 'Could not save this task.')
      } else {
        setError('Could not connect to the backend.')
      }
    } finally {
      setSaving(false)
    }
  }

  const updateStatus = async (task: Task, nextStatus: TaskStatus) => {
    try {
      setError('')
      await api.put(`/tasks/${task.id}`, { status: nextStatus })
      setMessage('Task status updated.')
      await fetchTasks()
    } catch {
      setError('Could not update task status.')
    }
  }

  const deleteTask = async (task: Task) => {
    if (!window.confirm(`Delete "${task.title}"?`)) return

    try {
      await api.delete(`/tasks/${task.id}`)
      if (editingId === task.id) resetEditor()
      setMessage('Task deleted successfully.')
      setError('')
      await fetchTasks()
    } catch {
      setError('Could not delete this task.')
    }
  }

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const query = search.toLowerCase().trim()
      const matchesSearch =
        `${task.title} ${task.description || ''} ${task.category || ''}`
          .toLowerCase()
          .includes(query)

      const matchesStatus =
        statusFilter === 'All' || task.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [tasks, search, statusFilter])

  const completedCount = tasks.filter(
    (task) => task.status === 'Completed'
  ).length

  const pendingCount = tasks.filter(
    (task) => task.status === 'Pending'
  ).length

  const inProgressCount = tasks.filter(
    (task) => task.status === 'In Progress'
  ).length

  const completionRate = tasks.length
    ? Math.round((completedCount / tasks.length) * 100)
    : 0

  const formatDate = (date?: string | null) => {
    if (!date) return 'No due date'
    return new Date(date).toLocaleDateString()
  }

  return (
    <div className="tasks-content">
      <section className="tasks-heading">
        <div>
          <span className="documents-eyebrow">PLAN · PRIORITISE · ACHIEVE</span>
          <h2>My Tasks</h2>
          <p>Organise your work, manage deadlines and keep making progress.</p>
        </div>

        <button
          className="tasks-refresh"
          onClick={fetchTasks}
          disabled={loading}
        >
          <RefreshCw size={15} /> Refresh
        </button>
      </section>

      {message && (
        <div className="tasks-message tasks-success">
          <CheckCircle2 size={16} />
          {message}
          <button onClick={() => setMessage('')} aria-label="Dismiss">
            <X size={15} />
          </button>
        </div>
      )}

      {error && (
        <div className="tasks-message tasks-error">
          <AlertCircle size={16} />
          {error}
          <button onClick={() => setError('')} aria-label="Dismiss">
            <X size={15} />
          </button>
        </div>
      )}

      <section className="task-stats">
        <article className="task-stat-card">
          <div className="task-stat-icon task-stat-blue">
            <ListTodo size={19} />
          </div>
          <span>Total tasks</span>
          <strong>{tasks.length}</strong>
        </article>

        <article className="task-stat-card">
          <div className="task-stat-icon task-stat-green">
            <CheckCircle2 size={19} />
          </div>
          <span>Completed</span>
          <strong>{completedCount}</strong>
        </article>

        <article className="task-stat-card">
          <div className="task-stat-icon task-stat-orange">
            <Clock3 size={19} />
          </div>
          <span>In progress</span>
          <strong>{inProgressCount}</strong>
        </article>

        <article className="task-stat-card">
          <div className="task-stat-icon task-stat-purple">
            <Circle size={19} />
          </div>
          <span>Pending</span>
          <strong>{pendingCount}</strong>
        </article>
      </section>

      <section className="task-progress-panel">
        <div>
          <h3>Overall progress</h3>
          <p>Keep going, every completed task counts.</p>
        </div>
        <strong>{completionRate}%</strong>
        <div className="task-progress-track">
          <div
            className="task-progress-fill"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </section>

      <section className="task-editor">
        <div className="task-editor-heading">
          <div className="task-editor-icon">
            <Plus size={20} />
          </div>
          <div>
            <h3>{editingId !== null ? 'Edit task' : 'Create a new task'}</h3>
            <p>
              {editingId !== null
                ? 'Update your task details.'
                : 'Add a task and let StudyMate help organise it.'}
            </p>
          </div>
        </div>

        <label className="tasks-label" htmlFor="task-title">
          Task title
        </label>
        <input
          id="task-title"
          className="tasks-input"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="e.g. Prepare for Database Management Systems exam"
          maxLength={255}
        />

        <label className="tasks-label" htmlFor="task-description">
          Description
        </label>
        <textarea
          id="task-description"
          className="tasks-textarea"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Add more details about this task..."
          rows={3}
        />

        <div className="task-form-grid">
          <div>
            <label className="tasks-label" htmlFor="task-category">
              Category
            </label>
            <select
              id="task-category"
              className="tasks-input"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="">Auto-detect with AI</option>
              <option value="Exam">Exam</option>
              <option value="Assignment">Assignment</option>
              <option value="Study">Study</option>
              <option value="Project">Project</option>
              <option value="Personal">Personal</option>
            </select>
          </div>

          <div>
            <label className="tasks-label" htmlFor="task-priority">
              Priority
            </label>
            <select
              id="task-priority"
              className="tasks-input"
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
            >
              <option value="">Auto-detect with AI</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div>
            <label className="tasks-label" htmlFor="task-status">
              Status
            </label>
            <select
              id="task-status"
              className="tasks-input"
              value={status}
              onChange={(event) => setStatus(event.target.value as TaskStatus)}
            >
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="tasks-label" htmlFor="task-due-date">
              Due date
            </label>
            <input
              id="task-due-date"
              type="datetime-local"
              className="tasks-input"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </div>
        </div>

        <div className="task-editor-actions">
          {editingId !== null && (
            <button
              className="task-cancel-button"
              onClick={resetEditor}
            >
              <X size={16} /> Cancel
            </button>
          )}

          <button
            className="task-save-button"
            onClick={saveTask}
            disabled={saving}
          >
            <Save size={16} />
            {saving
              ? 'Saving...'
              : editingId !== null
                ? 'Update task'
                : 'Add task'}
          </button>
        </div>
      </section>

      <section className="tasks-library">
        <div className="tasks-library-heading">
          <div>
            <h3>Your task list</h3>
            <p>{filteredTasks.length} task(s) displayed</p>
          </div>

          <label className="tasks-search">
            <Search size={16} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tasks..."
            />
          </label>
        </div>

        <div className="tasks-filter">
          <Filter size={15} />
          {['All', 'Pending', 'In Progress', 'Completed'].map((filter) => (
            <button
              key={filter}
              className={statusFilter === filter ? 'selected' : ''}
              onClick={() => setStatusFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="tasks-empty">
            <RefreshCw size={24} className="loading-icon" />
            <p>Loading your tasks...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="tasks-empty">
            <ListTodo size={34} />
            <h3>{search || statusFilter !== 'All' ? 'No matching tasks' : 'No tasks yet'}</h3>
            <p>
              {search || statusFilter !== 'All'
                ? 'Try changing your search or filter.'
                : 'Create your first task using the form above.'}
            </p>
          </div>
        ) : (
          <div className="tasks-list">
            {filteredTasks.map((task) => (
              <article className="task-item" key={task.id}>
                <div className="task-item-main">
                  <div className="task-item-title-row">
                    <h4 className={task.status === 'Completed' ? 'task-title-done' : ''}>
                      {task.title}
                    </h4>
                  </div>

                  {task.description && (
                    <p className="task-item-description">{task.description}</p>
                  )}

                  <div className="task-item-meta">
                    <span className="task-category-chip">{task.category}</span>

                    <span className={`task-priority-chip priority-${(task.priority || 'medium').toLowerCase()}`}>
                      {task.priority}
                    </span>

                    <span className="task-due-date">
                      <CalendarDays size={13} />
                      {formatDate(task.due_date)}
                    </span>
                  </div>
                </div>

                <div className="task-item-actions">
                  <select
                    aria-label={`Status of ${task.title}`}
                    className={`task-status-select status-${task.status.toLowerCase().replace(' ', '-')}`}
                    value={task.status}
                    onChange={(event) =>
                      updateStatus(task, event.target.value as TaskStatus)
                    }
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>

                  <button
                    onClick={() => editTask(task)}
                    title="Edit task"
                    aria-label={`Edit ${task.title}`}
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    onClick={() => deleteTask(task)}
                    title="Delete task"
                    aria-label={`Delete ${task.title}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default Tasks
