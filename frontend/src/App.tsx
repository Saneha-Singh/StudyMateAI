
import { useState } from 'react'
import {
  LayoutDashboard,
  FileText,
  NotebookPen,
  ListTodo,
  MessageCircle,
  ChartNoAxesCombined,
  Settings,
  Search,
  Bell,
  Plus,
  Upload,
  Sparkles,
  ArrowUpRight,
  Clock3,
  CheckCircle2,
  Circle,
  Menu,
  X,
  BookOpen,
  ChevronRight,
  Brain,
  CalendarDays,
} from 'lucide-react'

import './App.css'
import Documents from './Documents'
import Summarizer from './Summarizer'
import Chat from './Chat'
import Notes from './Notes'
import Tasks from './Tasks'
import Analytics from './Analytics'

const navigation = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Documents', icon: FileText },
  { label: 'Summarizer', icon: BookOpen },
  { label: 'AI Chat', icon: MessageCircle },
  { label: 'My Notes', icon: NotebookPen },
  { label: 'My Tasks', icon: ListTodo },
  { label: 'Analytics', icon: ChartNoAxesCombined },
]

const initialTasks = [
  {
    id: 1,
    title: 'Revise Database Management Systems',
    category: 'Exam',
    priority: 'High',
    done: false,
  },
  {
    id: 2,
    title: 'Complete Machine Learning assignment',
    category: 'Assignment',
    priority: 'Medium',
    done: false,
  },
  {
    id: 3,
    title: 'Review Binary Search Trees',
    category: 'Study',
    priority: 'Low',
    done: true,
  },
]

function App() {
  const [activePage, setActivePage] = useState('Dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [tasks, setTasks] = useState(initialTasks)
  const [search, setSearch] = useState('')

  const completedTasks = tasks.filter((task) => task.done).length

  const toggleTask = (id: number) => {
    setTasks((current) =>
      current.map((task) =>
        task.id === id ? { ...task, done: !task.done } : task
      )
    )
  }

  const navigate = (page: string) => {
    setActivePage(page)
    setSidebarOpen(false)
  }

  return (
    <div className="app-shell">
      {sidebarOpen && (
        <button
          className="sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-icon">
            <Brain size={23} />
          </div>

          <div>
            <h1>
              StudyMate<span>AI</span>
            </h1>
            <p>YOUR LEARNING SPACE</p>
          </div>

          <button
            className="mobile-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="nav-label">WORKSPACE</div>

        <nav className="navigation">
          {navigation.map((item) => {
            const Icon = item.icon

            return (
              <button
                key={item.label}
                className={`nav-item ${
                  activePage === item.label ? 'active' : ''
                }`}
                onClick={() => navigate(item.label)}
              >
                <Icon size={19} strokeWidth={1.8} />
                <span>{item.label}</span>

                {item.label === 'AI Chat' && (
                  <span className="nav-new">AI</span>
                )}
              </button>
            )
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <div className="tip-icon">
              <Sparkles size={18} />
            </div>
            <h3>Keep learning!</h3>
            <p>Small steps every day lead to big achievements.</p>
          </div>

          <button
            className="nav-item settings-item"
            onClick={() => navigate('Settings')}
          >
            <Settings size={19} />
            <span>Settings</span>
          </button>

          <div className="profile">
            <div className="avatar">S</div>

            <div className="profile-info">
              <strong>Student</strong>
              <span>My workspace</span>
            </div>

            <button
              aria-label="Profile options"
              className="profile-more"
            >
              ···
            </button>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={22} />
            </button>

            <div className="breadcrumb">
              <span>Workspace</span>
              <ChevronRight size={15} />
              <strong>{activePage}</strong>
            </div>
          </div>

          <div className="topbar-actions">
            <label className="search-box">
              <Search size={17} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search anything..."
              />
              <kbd>⌘ K</kbd>
            </label>

            <button
              className="icon-button notification-button"
              aria-label="Notifications"
            >
              <Bell size={19} />
              <span />
            </button>
          </div>
        </header>

        {activePage === 'Dashboard' ? (
          <div className="dashboard-content">
            <section className="welcome-section">
              <div>
                <div className="eyebrow">
                  <Sparkles size={14} /> YOUR PERSONAL LEARNING SPACE
                </div>

                <h2>
                  Welcome back, <span>Student!</span>
                </h2>

                <p>Ready to make today a productive learning day?</p>
              </div>

              <div className="date-chip">
                <CalendarDays size={17} />
                Your study dashboard
              </div>
            </section>

            <section className="hero-banner">
              <div className="hero-copy">
                <div className="hero-tag">
                  <Sparkles size={14} /> STUDY SMARTER WITH AI
                </div>

                <h2>
                  Your learning journey,
                  <br />
                  all in one place.
                </h2>

                <p>
                  Organise your notes, understand your documents
                  <br className="desktop-break" /> and stay on top of your goals
                  with StudyMate AI.
                </p>

                <button
                  className="hero-button"
                  onClick={() => navigate('AI Chat')}
                >
                  Explore AI Chat <ArrowUpRight size={17} />
                </button>
              </div>

              <div className="hero-art" aria-hidden="true">
                <div className="orbit orbit-one" />
                <div className="orbit orbit-two" />

                <div className="hero-book">
                  <BookOpen size={66} strokeWidth={1.2} />
                </div>

                <div className="floating-sparkle sparkle-one">
                  <Sparkles size={22} />
                </div>

                <div className="floating-sparkle sparkle-two">
                  <Brain size={25} />
                </div>
              </div>
            </section>

            <section className="stats-grid">
              <article className="stat-card">
                <div className="stat-top">
                  <div className="stat-icon blue">
                    <FileText size={20} />
                  </div>
                  <span className="stat-caption">YOUR LIBRARY</span>
                </div>

                <strong>—</strong>
                <p>Documents uploaded</p>
                <span className="stat-foot">Your study materials</span>
              </article>

              <article className="stat-card">
                <div className="stat-top">
                  <div className="stat-icon purple">
                    <ListTodo size={20} />
                  </div>
                  <span className="stat-caption">TASK TRACKER</span>
                </div>

                <strong>
                  {completedTasks}
                  <small> / {tasks.length}</small>
                </strong>

                <p>Tasks completed</p>
                <span className="stat-foot">In this demo session</span>
              </article>

              <article className="stat-card">
                <div className="stat-top">
                  <div className="stat-icon green">
                    <NotebookPen size={20} />
                  </div>
                  <span className="stat-caption">YOUR NOTES</span>
                </div>

                <strong>—</strong>
                <p>Notes created</p>
                <span className="stat-foot">Ideas worth keeping</span>
              </article>

              <article className="stat-card">
                <div className="stat-top">
                  <div className="stat-icon orange">
                    <ChartNoAxesCombined size={20} />
                  </div>
                  <span className="stat-caption">YOUR PROGRESS</span>
                </div>

                <strong>—</strong>
                <p>Completion rate</p>
                <span className="stat-foot">Based on your tasks</span>
              </article>
            </section>

            <section className="dashboard-grid">
              <article className="panel tasks-panel">
                <div className="panel-heading">
                  <div>
                    <h3>Today's tasks</h3>
                    <p>A little progress goes a long way.</p>
                  </div>

                  <button
                    className="text-action"
                    onClick={() => navigate('My Tasks')}
                  >
                    View all <ChevronRight size={16} />
                  </button>
                </div>

                <div className="task-list">
                  {tasks.map((task) => (
                    <div
                      className={`task-row ${
                        task.done ? 'task-done' : ''
                      }`}
                      key={task.id}
                    >
                      <button
                        className="task-check"
                        onClick={() => toggleTask(task.id)}
                        aria-label={
                          task.done ? 'Mark incomplete' : 'Mark complete'
                        }
                      >
                        {task.done ? (
                          <CheckCircle2 size={21} />
                        ) : (
                          <Circle size={21} />
                        )}
                      </button>

                      <div className="task-details">
                        <strong>{task.title}</strong>
                        <span>{task.category}</span>
                      </div>

                      <span
                        className={`priority priority-${task.priority.toLowerCase()}`}
                      >
                        {task.priority}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  className="add-task-button"
                  onClick={() => navigate('My Tasks')}
                >
                  <Plus size={17} /> Manage your tasks
                </button>
              </article>

              <article className="panel quick-panel">
                <div className="panel-heading">
                  <div>
                    <h3>Quick actions</h3>
                    <p>What would you like to do?</p>
                  </div>
                </div>

                <button
                  className="quick-action"
                  onClick={() => navigate('Documents')}
                >
                  <div className="quick-icon quick-blue">
                    <Upload size={19} />
                  </div>

                  <div>
                    <strong>Upload a document</strong>
                    <span>PDF, DOCX or PPTX</span>
                  </div>

                  <ChevronRight size={17} />
                </button>

                <button
                  className="quick-action"
                  onClick={() => navigate('AI Chat')}
                >
                  <div className="quick-icon quick-purple">
                    <MessageCircle size={19} />
                  </div>

                  <div>
                    <strong>Ask StudyMate AI</strong>
                    <span>Get answers from your documents</span>
                  </div>

                  <ChevronRight size={17} />
                </button>

                <button
                  className="quick-action"
                  onClick={() => navigate('My Notes')}
                >
                  <div className="quick-icon quick-green">
                    <NotebookPen size={19} />
                  </div>

                  <div>
                    <strong>Create a note</strong>
                    <span>Save your important ideas</span>
                  </div>

                  <ChevronRight size={17} />
                </button>

                <button
                  className="quick-action"
                  onClick={() => navigate('Summarizer')}
                >
                  <div className="quick-icon quick-orange">
                    <Sparkles size={19} />
                  </div>

                  <div>
                    <strong>Summarize a document</strong>
                    <span>Get the key takeaways</span>
                  </div>

                  <ChevronRight size={17} />
                </button>
              </article>
            </section>

            <section className="bottom-grid">
              <article className="panel progress-panel">
                <div className="panel-heading">
                  <div>
                    <h3>Your task progress</h3>
                    <p>Track your completed tasks.</p>
                  </div>

                  <div className="progress-icon">
                    <ChartNoAxesCombined size={19} />
                  </div>
                </div>

                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${
                        tasks.length
                          ? (completedTasks / tasks.length) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>

                <div className="progress-caption">
                  <span>{completedTasks} completed</span>
                  <span>{tasks.length - completedTasks} remaining</span>
                </div>
              </article>

              <article className="panel focus-panel">
                <div className="focus-icon">
                  <Clock3 size={21} />
                </div>

                <div>
                  <h3>Make time to focus</h3>
                  <p>
                    Choose one task and give it your full attention. You've
                    got this!
                  </p>
                </div>
              </article>
            </section>

            <footer className="dashboard-footer">
              <span>Made for curious minds.</span>
              <span>StudyMate AI · Your learning companion</span>
            </footer>
          </div>
        ) : activePage === 'Documents' ? (
          <Documents />
                ) : activePage === 'Summarizer' ? (
          <Summarizer />
                ) : activePage === 'AI Chat' ? (
          <Chat />
                ) : activePage === 'My Notes' ? (
          <Notes />
                ) : activePage === 'My Tasks' ? (
          <Tasks />
        ) : activePage === 'Analytics' ? (
          <Analytics />
        ) : (
          <div className="coming-content">
            <div className="coming-icon">
              <Sparkles size={28} />
            </div>

            <span className="eyebrow">STUDYMATE WORKSPACE</span>
            <h2>{activePage}</h2>

            <p>
              This section is ready for development. We'll connect it to your
              FastAPI backend next.
            </p>

            <button
              className="hero-button"
              onClick={() => navigate('Dashboard')}
            >
              Back to dashboard <ArrowUpRight size={17} />
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
