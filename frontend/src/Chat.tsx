
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Bot,
  Send,
  User,
  Sparkles,
  FileText,
  ChevronDown,
  RefreshCw,
  AlertCircle,
  BookOpen,
  MessageCircle,
} from 'lucide-react'

import api from './api'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

interface DocumentItem {
  id: number
  filename: string
  file_type: string
  created_at: string
}

interface ChatSource {
  filename: string
  chunk_number: number
}

interface ChatResponse {
  document_id: number
  question: string
  answer: string
  response_mode: 'llm' | 'retrieval_fallback' | 'no_relevant_context'
  sources: ChatSource[]
}

interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  responseMode?: ChatResponse['response_mode']
  sources?: ChatSource[]
}

// Clean AI-generated Markdown before rendering
const formatMarkdown = (content: string) => {
  return content
    .replace(/<br\s*\/?>/gi, '  \n')
    .replace(/\r\n/g, '\n')
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => `$${math}$`)
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => `$$${math}$$`)
    .trim()
}

function Chat() {
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [selectedDocument, setSelectedDocument] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [question, setQuestion] = useState('')
  const [loadingDocuments, setLoadingDocuments] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch uploaded documents
  const fetchDocuments = useCallback(async () => {
    try {
      setLoadingDocuments(true)

      const response = await api.get<DocumentItem[]>('/documents/')

      setDocuments(response.data)

      if (response.data.length > 0) {
        setSelectedDocument(String(response.data[0].id))
      }
    } catch {
      setError('Could not load your documents. Please check your backend.')
    } finally {
      setLoadingDocuments(false)
    }
  }, [])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  // Automatically scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    })
  }, [messages, sending])

  // Change selected document
  const handleDocumentChange = (value: string) => {
    setSelectedDocument(value)
    setMessages([])
    setError('')
  }

  // Send question to backend
  const sendMessage = async () => {
    const trimmedQuestion = question.trim()

    if (!trimmedQuestion || sending) return

    if (!selectedDocument) {
      setError('Please select a document before asking a question.')
      return
    }

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: 'user',
      content: trimmedQuestion,
    }

    setMessages((current) => [...current, userMessage])
    setQuestion('')
    setError('')
    setSending(true)

    try {
      const response = await api.post<ChatResponse>('/chat/', {
        document_id: Number(selectedDocument),
        question: trimmedQuestion,
      })

      const assistantMessage: ChatMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.data.answer,
        responseMode: response.data.response_mode,
        sources: response.data.sources || [],
      }

      setMessages((current) => [...current, assistantMessage])
    } catch (err: unknown) {
      let errorMessage = 'Something went wrong. Please try again.'

      if (typeof err === 'object' && err !== null && 'response' in err) {
        const response = (
          err as { response?: { data?: { detail?: string } } }
        ).response

        errorMessage = response?.data?.detail || errorMessage
      } else {
        errorMessage = 'Could not connect to the backend.'
      }

      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 2,
          role: 'assistant',
          content: errorMessage,
        },
      ])
    } finally {
      setSending(false)
    }
  }

  // Enter sends; Shift + Enter creates a new line
  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendMessage()
    }
  }

  // Start a fresh conversation
  const clearConversation = () => {
    setMessages([])
    setError('')
  }

  // Response mode labels
  const getModeLabel = (mode?: ChatResponse['response_mode']) => {
    if (mode === 'llm') return 'AI-generated answer'
    if (mode === 'retrieval_fallback') return 'Retrieved document passages'
    if (mode === 'no_relevant_context') return 'No relevant context found'
    return ''
  }

  return (
    <div className="chat-content">

      {/* Page heading */}
      <section className="chat-heading">
        <div>
          <span className="documents-eyebrow">
            YOUR AI STUDY COMPANION
          </span>

          <h2>Chat with your Documents</h2>

          <p>
            Ask questions and understand your study material with
            document-grounded AI answers.
          </p>
        </div>

        {messages.length > 0 && (
          <button
            className="chat-clear-button"
            onClick={clearConversation}
          >
            <RefreshCw size={15} />
            New conversation
          </button>
        )}
      </section>

      {/* Chat workspace */}
      <section className="chat-workspace">

        {/* Document selector */}
        <div className="chat-document-bar">

          <div className="chat-document-label">
            <div className="chat-document-icon">
              <FileText size={19} />
            </div>

            <div>
              <strong>Knowledge source</strong>
              <span>Choose the document you want to discuss</span>
            </div>
          </div>

          {loadingDocuments ? (
            <div className="chat-loading-documents">
              <RefreshCw size={15} className="loading-icon" />
              Loading documents...
            </div>
          ) : documents.length === 0 ? (
            <span className="chat-no-documents">
              No uploaded documents
            </span>
          ) : (
            <div className="chat-select-wrapper">
              <select
                value={selectedDocument}
                onChange={(event) =>
                  handleDocumentChange(event.target.value)
                }
                aria-label="Select a document"
              >
                {documents.map((document) => (
                  <option
                    key={document.id}
                    value={String(document.id)}
                  >
                    {document.filename}
                  </option>
                ))}
              </select>

              <ChevronDown size={16} />
            </div>
          )}
        </div>

        {/* Messages area */}
        <div className="chat-messages">

          {documents.length === 0 && !loadingDocuments ? (
            <div className="chat-empty-state">
              <div className="chat-empty-icon">
                <BookOpen size={30} />
              </div>

              <h3>Your study library is empty</h3>

              <p>
                Upload a document first to start asking questions.
              </p>
            </div>

          ) : messages.length === 0 ? (

            <div className="chat-empty-state">
              <div className="chat-empty-icon">
                <Sparkles size={30} />
              </div>

              <h3>What would you like to learn?</h3>

              <p>
                Ask a question about your selected document.
                StudyMate AI will retrieve relevant passages to answer you.
              </p>

              <div className="chat-suggestions">

                <button
                  onClick={() =>
                    setQuestion('Can you summarise the main concepts?')
                  }
                >
                  <BookOpen size={15} />
                  Explain the main concepts
                </button>

                <button
                  onClick={() =>
                    setQuestion('What are the most important topics?')
                  }
                >
                  <Sparkles size={15} />
                  Identify important topics
                </button>

                <button
                  onClick={() =>
                    setQuestion('Explain this topic in simple words.')
                  }
                >
                  <MessageCircle size={15} />
                  Explain in simple words
                </button>

              </div>
            </div>

          ) : (

            <div className="chat-message-list">

              {messages.map((message) => (

                <div
                  key={message.id}
                  className={`chat-message ${
                    message.role === 'user'
                      ? 'user-message'
                      : 'assistant-message'
                  }`}
                >

                  {/* Avatar */}
                  <div className="chat-avatar">
                    {message.role === 'user' ? (
                      <User size={18} />
                    ) : (
                      <Bot size={19} />
                    )}
                  </div>

                  <div className="chat-message-body">

                    {/* Message author */}
                    <div className="chat-message-author">
                      {message.role === 'user'
                        ? 'You'
                        : 'StudyMate AI'}

                      {message.responseMode && (
                        <span className="chat-mode-label">
                          {getModeLabel(message.responseMode)}
                        </span>
                      )}
                    </div>

                    {/* Markdown-rendered message */}
                    
{/* Markdown-rendered message */}
                    <div className="chat-message-text">
                      {message.role === 'assistant' ? (
                        <div className="markdown-content">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm, remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                            components={{
                              a: ({ ...props }) => (
                                <a
                                  {...props}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                />
                              ),

                              table: ({ ...props }) => (
                                <div className="markdown-table-wrapper">
                                  <table {...props} />
                                </div>
                              ),

                              code: ({ className, children, ...props }) => (
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              ),
                            }}
                          >
                            {formatMarkdown(message.content)}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div className="chat-user-text">
                          {message.content}
                        </div>
                      )}
                    </div>

                    {/* Source references */}
                    {message.sources &&
                      message.sources.length > 0 && (

                        <div className="chat-sources">

                          <div className="chat-sources-heading">
                            <FileText size={15} />
                            Sources used
                          </div>

                          {message.sources.map((source, index) => (
                            <div
                              className="chat-source-item"
                              key={`${source.filename}-${source.chunk_number}-${index}`}
                            >
                              <FileText size={14} />

                              <span>{source.filename}</span>

                              <small>
                                Chunk {source.chunk_number}
                              </small>
                            </div>
                          ))}

                        </div>
                      )}

                  </div>
                </div>

              ))}

              {/* Loading animation */}
              {sending && (
                <div className="chat-message assistant-message">

                  <div className="chat-avatar">
                    <Bot size={19} />
                  </div>

                  <div className="chat-message-body">

                    <div className="chat-message-author">
                      StudyMate AI
                    </div>

                    <div className="chat-typing">
                      <span />
                      <span />
                      <span />
                      <small>Searching your document...</small>
                    </div>

                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />

            </div>
          )}

        </div>

        {/* Error message */}
        {error && (
          <div className="chat-error">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Input area */}
        <div className="chat-input-area">

          <div className="chat-input-box">

            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your document..."
              rows={2}
              disabled={sending || documents.length === 0}
            />

            <button
              className="chat-send-button"
              onClick={sendMessage}
              disabled={
                sending ||
                !question.trim() ||
                !selectedDocument ||
                documents.length === 0
              }
              aria-label="Send message"
            >
              <Send size={18} />
            </button>

          </div>

          <div className="chat-input-hint">
            <span>
              StudyMate AI answers using your selected document.
            </span>

            <span>
              Enter to send · Shift + Enter for a new line
            </span>
          </div>

        </div>

      </section>
    </div>
  )
}

export default Chat
