
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Plus, Search, NotebookPen, Trash2, Pencil, X,
  Save, RefreshCw, FileText, AlertCircle, CheckCircle2
} from 'lucide-react'
import api from './api'

interface Note {
  id: number
  title: string
  content: string
  created_at: string
  updated_at?: string | null
}

function Notes() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get<Note[]>('/notes/')
      setNotes(response.data)
      setError('')
    } catch {
      setError('Could not load notes. Check that your backend is running.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  const resetEditor = () => {
    setEditingId(null)
    setTitle('')
    setContent('')
  }

  const openNewNote = () => {
    setEditingId(null)
    setTitle('')
    setContent('')
    setError('')
    setMessage('')
  }

  const openEditNote = (note: Note) => {
    setEditingId(note.id)
    setTitle(note.title)
    setContent(note.content)
    setError('')
    setMessage('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const saveNote = async () => {
    if (!title.trim() || !content.trim()) {
      setError('Please enter both a title and note content.')
      return
    }

    try {
      setSaving(true)
      setError('')

      const payload = {
        title: title.trim(),
        content: content.trim(),
      }

      if (editingId !== null) {
        await api.put(`/notes/${editingId}`, payload)
        setMessage('Note updated successfully.')
      } else {
        await api.post('/notes/', payload)
        setMessage('Note created successfully.')
      }

      resetEditor()
      await fetchNotes()
    } catch {
      setError('Could not save your note. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const deleteNote = async (note: Note) => {
    if (!window.confirm(`Delete "${note.title}"?`)) return

    try {
      await api.delete(`/notes/${note.id}`)
      if (editingId === note.id) resetEditor()
      setMessage('Note deleted successfully.')
      setError('')
      await fetchNotes()
    } catch {
      setError('Could not delete this note.')
    }
  }

  const filteredNotes = useMemo(() => {
    const query = search.toLowerCase().trim()
    return notes.filter((note) =>
      `${note.title} ${note.content}`.toLowerCase().includes(query)
    )
  }, [notes, search])

  return (
    <div className="notes-content">
      <section className="notes-heading">
        <div>
          <span className="documents-eyebrow">YOUR PERSONAL KNOWLEDGE SPACE</span>
          <h2>My Notes</h2>
          <p>Capture ideas, save important concepts and organise your learning.</p>
        </div>
        <button className="notes-refresh" onClick={fetchNotes} disabled={loading}>
          <RefreshCw size={15} /> Refresh
        </button>
      </section>

      {message && (
        <div className="notes-message notes-success">
          <CheckCircle2 size={16} />
          {message}
          <button onClick={() => setMessage('')} aria-label="Dismiss">
            <X size={15} />
          </button>
        </div>
      )}

      {error && (
        <div className="notes-message notes-error">
          <AlertCircle size={16} />
          {error}
          <button onClick={() => setError('')} aria-label="Dismiss">
            <X size={15} />
          </button>
        </div>
      )}

      <section className="note-editor">
        <div className="note-editor-heading">
          <div className="note-editor-icon">
            <NotebookPen size={20} />
          </div>
          <div>
            <h3>{editingId !== null ? 'Edit your note' : 'Create a new note'}</h3>
            <p>
              {editingId !== null
                ? 'Make changes to your saved note.'
                : 'Write down something worth remembering.'}
            </p>
          </div>
        </div>

        <label className="notes-label" htmlFor="note-title">Note title</label>
        <input
          id="note-title"
          className="notes-title-input"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Give your note a title..."
          maxLength={255}
        />

        <label className="notes-label" htmlFor="note-content">Your notes</label>
        <textarea
          id="note-content"
          className="notes-textarea"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Start writing your thoughts, concepts or study notes..."
          rows={6}
        />

        <div className="note-editor-actions">
          {editingId !== null && (
            <button className="notes-cancel-button" onClick={resetEditor}>
              <X size={16} /> Cancel
            </button>
          )}
          <button
            className="notes-save-button"
            onClick={saveNote}
            disabled={saving}
          >
            <Save size={16} />
            {saving ? 'Saving...' : editingId !== null ? 'Update note' : 'Save note'}
          </button>
        </div>
      </section>

      <section className="notes-library">
        <div className="notes-library-heading">
          <div>
            <h3>Your saved notes</h3>
            <p>{notes.length} note(s) in your collection</p>
          </div>
          <label className="notes-search">
            <Search size={16} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search your notes..."
            />
          </label>
        </div>

        {loading ? (
          <div className="notes-empty">
            <RefreshCw size={24} className="loading-icon" />
            <p>Loading your notes...</p>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="notes-empty">
            <FileText size={34} />
            <h3>{search ? 'No matching notes' : 'No notes yet'}</h3>
            <p>
              {search
                ? 'Try another search term.'
                : 'Create your first note using the editor above.'}
            </p>
          </div>
        ) : (
          <div className="notes-grid">
            {filteredNotes.map((note) => (
              <article className="note-card" key={note.id}>
                <div className="note-card-top">
                  <div className="note-card-icon">
                    <NotebookPen size={18} />
                  </div>
                  <div className="note-card-actions">
                    <button
                      onClick={() => openEditNote(note)}
                      aria-label={`Edit ${note.title}`}
                      title="Edit note"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => deleteNote(note)}
                      aria-label={`Delete ${note.title}`}
                      title="Delete note"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <h4>{note.title}</h4>
                <p className="note-card-content">{note.content}</p>

                <div className="note-card-date">
                  Updated {new Date(
                    note.updated_at || note.created_at
                  ).toLocaleDateString()}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default Notes
