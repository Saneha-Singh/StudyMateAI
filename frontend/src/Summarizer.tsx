
import { useEffect, useState } from 'react'
import {
  Sparkles,
  FileText,
  BookOpen,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Tag,
  WandSparkles,
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

interface SummaryResult {
  document_id: number
  filename: string
  summary: string
  summary_sentences: number
  keywords: {
    keyword: string
    score: number
  }[]
}

type SummaryLength = 'quick' | 'balanced' | 'detailed'

const summaryRanges: Record<
  SummaryLength,
  { min: number; max: number }
> = {
  quick: { min: 5, max: 8 },
  balanced: { min: 10, max: 15 },
  detailed: { min: 16, max: 25 },
}

const summaryLabels: Record<SummaryLength, string> = {
  quick: 'Quick revision',
  balanced: 'Balanced summary',
  detailed: 'Detailed summary',
}

function Summarizer() {
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [selectedDocument, setSelectedDocument] = useState('')
  const [summaryLength, setSummaryLength] =
    useState<SummaryLength>('balanced')

  const [result, setResult] = useState<SummaryResult | null>(null)
  const [loadingDocuments, setLoadingDocuments] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  // Fetch uploaded documents
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await api.get<DocumentItem[]>('/documents/')

        setDocuments(response.data)

        if (response.data.length > 0) {
          setSelectedDocument(String(response.data[0].id))
        }
      } catch {
        setError('Could not load documents. Please check your backend.')
      } finally {
        setLoadingDocuments(false)
      }
    }

    fetchDocuments()
  }, [])

  // Generate summary
  const generateSummary = async () => {
    if (!selectedDocument) {
      setError('Please upload a document before generating a summary.')
      return
    }

    const range = summaryRanges[summaryLength]

    try {
      setGenerating(true)
      setError('')
      setResult(null)

      const response = await api.post<SummaryResult>(
        `/summarizer/${selectedDocument}`,
        null,
        {
          params: {
            min_sentences: range.min,
            max_sentences: range.max,
          },
        }
      )

      setResult(response.data)
    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'response' in err
      ) {
        const apiError = (
          err as {
            response?: {
              data?: {
                detail?: string
              }
            }
          }
        ).response

        setError(
          apiError?.data?.detail || 'Could not generate summary.'
        )
      } else {
        setError('Could not connect to the backend.')
      }
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="summarizer-content">

      {/* Page heading */}
      <section className="summarizer-heading">
        <div>
          <span className="documents-eyebrow">
            AI-POWERED LEARNING
          </span>

          <h2>Document Summarizer</h2>

          <p>
            Turn lengthy study materials into concise, useful summaries.
          </p>
        </div>
      </section>

      {/* Hero section */}
      <section className="summarizer-hero">
        <div className="summarizer-hero-icon">
          <WandSparkles size={28} />
        </div>

        <h3>Understand more in less time.</h3>

        <p>
          Select your study material and let StudyMate AI identify
          the key information and important keywords.
        </p>
      </section>

      {/* Document and summary controls */}
      <section className="summarizer-controls">

        <div className="summarizer-section-heading">
          <div className="summarizer-small-icon">
            <FileText size={19} />
          </div>

          <div>
            <h3>Choose your document</h3>
            <p>Select a document from your uploaded library.</p>
          </div>
        </div>

        {loadingDocuments ? (
          <div className="summarizer-loading">
            <RefreshCw size={18} className="loading-icon" />
            Loading your documents...
          </div>
        ) : documents.length === 0 ? (
          <div className="summarizer-no-documents">
            <BookOpen size={25} />
            <strong>No documents available</strong>
            <p>
              Upload a PDF, DOCX or PPTX from the Documents page first.
            </p>
          </div>
        ) : (
          <>
            <label
              className="summarizer-label"
              htmlFor="summary-document"
            >
              Uploaded study materials
            </label>

            <select
              id="summary-document"
              className="summarizer-select"
              value={selectedDocument}
              onChange={(event) => {
                setSelectedDocument(event.target.value)
                setResult(null)
                setError('')
              }}
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

            {/* Summary depth */}
            <div className="sentence-setting">
              <div>
                <label htmlFor="summary-length">
                  Summary depth
                </label>

                <p>
                  Choose how detailed your summary should be.
                </p>
              </div>

              <select
                id="summary-length"
                className="sentence-select"
                value={summaryLength}
                onChange={(event) => {
                  setSummaryLength(
                    event.target.value as SummaryLength
                  )
                  setResult(null)
                }}
              >
                <option value="quick">
                  Quick revision (5–8 sentences)
                </option>

                <option value="balanced">
                  Balanced (10–15 sentences)
                </option>

                <option value="detailed">
                  Detailed (16–25 sentences)
                </option>
              </select>
            </div>

            {/* Generate button */}
            <button
              className="generate-summary-button"
              onClick={generateSummary}
              disabled={generating || !selectedDocument}
            >
              {generating ? (
                <>
                  <RefreshCw
                    size={17}
                    className="loading-icon"
                  />
                  Generating summary...
                </>
              ) : (
                <>
                  <Sparkles size={17} />
                  Generate Summary
                </>
              )}
            </button>
          </>
        )}
      </section>

      {/* Error message */}
      {error && (
        <div className="summarizer-error">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Summary results */}
      {result && (
        <section className="summary-results">

          <div className="summary-result-heading">
            <div>
              <span className="documents-eyebrow">
                YOUR AI SUMMARY
              </span>

              <h3>Summary generated successfully</h3>

              <p>
                <CheckCircle2 size={14} />
                {result.filename}
              </p>
            </div>

            <div className="summary-result-icon">
              <Sparkles size={23} />
            </div>
          </div>

          {/* Summary content */}
          <div className="summary-text-card">

            <div className="summary-card-heading">
              <BookOpen size={18} />

              <strong>Key Takeaways</strong>

              <span>
                {summaryLabels[summaryLength]}
              </span>
            </div>

            <div className="summary-text markdown-content">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
              >
                {result.summary}
              </ReactMarkdown>
            </div>

          </div>

          {/* Keywords */}
          <div className="keywords-card">

            <div className="keywords-heading">
              <Tag size={18} />
              <strong>Important Keywords</strong>
            </div>

            <p>
              Key terms extracted from your document using RAKE.
            </p>

            <div className="keyword-list">
              {result.keywords.map((item, index) => (
                <span
                  className="keyword-chip"
                  key={`${item.keyword}-${index}`}
                  title={`Importance score: ${item.score}`}
                >
                  {item.keyword}
                </span>
              ))}
            </div>

          </div>

          {/* Generate again */}
          <button
            className="generate-again-button"
            onClick={generateSummary}
            disabled={generating}
          >
            <RefreshCw size={16} />
            Generate again
          </button>

        </section>
      )}
    </div>
  )
}

export default Summarizer
