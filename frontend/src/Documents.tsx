
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Upload, FileText, File, FileSpreadsheet,
  Trash2, Download, RefreshCw, Search,
  FolderOpen, X, CheckCircle2, AlertCircle
} from 'lucide-react'
import api from './api'

interface DocumentItem {
  id: number
  filename: string
  file_type: string
  created_at: string
}

function Documents() {
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get<DocumentItem[]>('/documents/')
      setDocuments(response.data)
      setError('')
    } catch {
      setError('Could not load documents. Check that your backend is running.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const uploadDocument = async (file?: globalThis.File) => {
    if (!file) return

    setMessage('')
    setError('')

    const extension = file.name.split('.').pop()?.toLowerCase()

    if (!['pdf', 'docx', 'pptx'].includes(extension || '')) {
      setError('Only PDF, DOCX and PPTX files are supported.')
      return
    }

    if (file.size === 0) {
      setError('This file is empty.')
      return
    }

    if (file.size > 15 * 1024 * 1024) {
      setError('File size must not exceed 15 MB.')
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    try {
      setUploading(true)

      await api.post('/documents/upload', formData)

      setMessage(`${file.name} uploaded successfully!`)
      await fetchDocuments()
    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'response' in err
      ) {
        const response = (err as {
          response?: { data?: { detail?: string } }
        }).response

        setError(
          response?.data?.detail || 'Document upload failed.'
        )
      } else {
        setError('Could not connect to the backend.')
      }
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const deleteDocument = async (document: DocumentItem) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${document.filename}"?`
    )

    if (!confirmed) return

    try {
      await api.delete(`/documents/${document.id}`)
      setMessage('Document deleted successfully.')
      setError('')
      await fetchDocuments()
    } catch {
      setError('Could not delete this document.')
    }
  }

  const getFileIcon = (type: string) => {
    if (type === 'pdf') return <FileText size={21} />
    if (type === 'docx') return <File size={21} />
    return <FileSpreadsheet size={21} />
  }

  const filteredDocuments = documents.filter((document) =>
    document.filename.toLowerCase().includes(search.toLowerCase())
  )

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    uploadDocument(event.dataTransfer.files[0])
  }

  return (
    <div className="documents-content">

      <section className="documents-heading">
        <div>
          <span className="documents-eyebrow">YOUR LEARNING LIBRARY</span>
          <h2>My Documents</h2>
          <p>Upload and organise your study materials in one place.</p>
        </div>

        <button
          className="documents-refresh"
          onClick={fetchDocuments}
          disabled={loading}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </section>

      <section
        className={`upload-zone ${dragging ? 'upload-zone-active' : ''}`}
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <div className="upload-icon">
          <Upload size={27} />
        </div>

        <h3>Upload your study materials</h3>
        <p>Drag and drop your files here, or browse your computer.</p>

        <button
          className="documents-upload-button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Upload size={16} />
          {uploading ? 'Uploading...' : 'Choose files'}
        </button>

        <span className="upload-formats">
          Supported: PDF, DOCX, PPTX · Maximum size: 15 MB
        </span>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.pptx"
          hidden
          onChange={(event) =>
            uploadDocument(event.target.files?.[0])
          }
        />

        {uploading && (
          <div className="upload-progress">
            Processing and indexing your document...
          </div>
        )}
      </section>

      {message && (
        <div className="documents-message success-message">
          <CheckCircle2 size={17} />
          {message}
          <button onClick={() => setMessage('')} aria-label="Dismiss">
            <X size={15} />
          </button>
        </div>
      )}

      {error && (
        <div className="documents-message error-message">
          <AlertCircle size={17} />
          {error}
          <button onClick={() => setError('')} aria-label="Dismiss">
            <X size={15} />
          </button>
        </div>
      )}

      <section className="document-library">
        <div className="library-heading">
          <div>
            <h3>Your library</h3>
            <p>{documents.length} uploaded document(s)</p>
          </div>

          <label className="document-search">
            <Search size={16} />
            <input
              placeholder="Search documents..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </div>

        {loading ? (
          <div className="documents-empty">
            <RefreshCw className="loading-icon" size={25} />
            <p>Loading your documents...</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="documents-empty">
            <FolderOpen size={35} />
            <h3>{search ? 'No matching documents' : 'Your library is empty'}</h3>
            <p>
              {search
                ? 'Try searching with a different filename.'
                : 'Upload your first study document to get started.'}
            </p>
          </div>
        ) : (
          <div className="document-list">
            {filteredDocuments.map((document) => (
              <article className="document-row" key={document.id}>
                <div className={`document-file-icon file-${document.file_type}`}>
                  {getFileIcon(document.file_type)}
                </div>

                <div className="document-info">
                  <strong>{document.filename}</strong>
                  <span>
                    {document.file_type.toUpperCase()} ·{' '}
                    {new Date(document.created_at).toLocaleDateString()}
                  </span>
                </div>

                <span className="document-type">
                  {document.file_type.toUpperCase()}
                </span>

                <button
                  className="document-delete"
                  onClick={() => deleteDocument(document)}
                  title="Delete document"
                  aria-label={`Delete ${document.filename}`}
                >
                  <Trash2 size={17} />
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default Documents
