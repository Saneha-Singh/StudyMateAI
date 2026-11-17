
import { useCallback, useEffect, useState } from 'react'

import {
  RefreshCw,
  FileText,
  NotebookPen,
  ListTodo,
  CheckCircle2,
  Clock3,
  Target,
  AlertCircle,
  TrendingUp,
} from 'lucide-react'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

import api from './api'


interface AnalyticsData {
  total_tasks: number
  completed_tasks: number
  pending_tasks: number
  in_progress_tasks: number
  completion_rate: number
  priority_distribution: Record<string, number>
  category_distribution: Record<string, number>
  total_notes: number
  total_documents: number
}

interface AnalyticsApiResponse {
  total_tasks?: number
  completed_tasks?: number
  pending_tasks?: number
  in_progress_tasks?: number
  completion_rate?: number

  task_statistics?: {
    total_tasks?: number
    completed?: number
    pending?: number
    in_progress?: number
    completion_rate?: number
  }

  priority_distribution?: Record<string, number>
  category_distribution?: Record<string, number>
  total_notes?: number
  total_documents?: number
}

const chartColors = [
  '#7184d7',
  '#8d80c9',
  '#65a98a',
  '#e0a36d',
  '#d77f91',
]

function normalizeAnalytics(
  response: AnalyticsApiResponse
): AnalyticsData {
  const stats = response.task_statistics || {}

  const totalTasks = Number(
    response.total_tasks ?? stats.total_tasks ?? 0
  )

  const completedTasks = Number(
    response.completed_tasks ?? stats.completed ?? 0
  )

  const pendingTasks = Number(
    response.pending_tasks ?? stats.pending ?? 0
  )

  const inProgressTasks = Number(
    response.in_progress_tasks ?? stats.in_progress ?? 0
  )

  const rawRate = Number(
    response.completion_rate ??
    stats.completion_rate ??
    (totalTasks > 0
      ? (completedTasks / totalTasks) * 100
      : 0)
  )

  return {
    total_tasks: totalTasks,
    completed_tasks: completedTasks,
    pending_tasks: pendingTasks,
    in_progress_tasks: inProgressTasks,

    completion_rate: Number.isFinite(rawRate)
      ? Math.min(100, Math.max(0, rawRate))
      : 0,

    priority_distribution:
      response.priority_distribution || {},

    category_distribution:
      response.category_distribution || {},

    total_notes: Number(response.total_notes ?? 0),
    total_documents: Number(response.total_documents ?? 0),
  }
}


function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const response = await api.get<AnalyticsApiResponse>(
        '/analytics/'
      )

      setData(normalizeAnalytics(response.data))

    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'response' in err
      ) {
        const response = (
          err as {
            response?: {
              data?: {
                detail?: string
              }
            }
          }
        ).response

        setError(
          response?.data?.detail ||
          'Could not load analytics.'
        )
      } else {
        setError('Could not connect to the backend.')
      }

    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])


  // Actual task status data
  const statusData = data
    ? [
        {
          name: 'Completed',
          tasks: data.completed_tasks,
        },
        {
          name: 'In Progress',
          tasks: data.in_progress_tasks,
        },
        {
          name: 'Pending',
          tasks: data.pending_tasks,
        },
      ]
    : []


  // Actual priority data
  const priorityData = data
    ? Object.entries(data.priority_distribution).map(
        ([name, value]) => ({
          name,
          value: Number(value),
        })
      )
    : []


  // Actual category data
  const categoryData = data
    ? Object.entries(data.category_distribution).map(
        ([name, value]) => ({
          name,
          value: Number(value),
        })
      )
    : []


  if (loading) {
    return (
      <div className="analytics-content">
        <div className="analytics-loading">
          <RefreshCw
            size={25}
            className="loading-icon"
          />
          <p>Preparing your learning analytics...</p>
        </div>
      </div>
    )
  }


  return (
    <div className="analytics-content">

      {/* PAGE HEADING */}

      <section className="analytics-heading">
        <div>
          <span className="documents-eyebrow">
            YOUR LEARNING INSIGHTS
          </span>

          <h2>Analytics</h2>

          <p>
            Understand your productivity and track your learning progress.
          </p>
        </div>

        <button
          className="analytics-refresh"
          onClick={fetchAnalytics}
          disabled={loading}
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </section>


      {/* ERROR MESSAGE */}

      {error && (
        <div className="analytics-error">
          <AlertCircle size={17} />
          {error}
        </div>
      )}


      {data && (
        <>

          {/* SUMMARY CARDS */}

          <section className="analytics-stats">

            <article className="analytics-stat-card">
              <div className="analytics-stat-icon analytics-blue">
                <ListTodo size={20} />
              </div>

              <span>Total tasks</span>
              <strong>{data.total_tasks}</strong>

              <small>Your entire task list</small>
            </article>


            <article className="analytics-stat-card">
              <div className="analytics-stat-icon analytics-green">
                <CheckCircle2 size={20} />
              </div>

              <span>Completed tasks</span>
              <strong>{data.completed_tasks}</strong>

              <small>Tasks you've finished</small>
            </article>


            <article className="analytics-stat-card">
              <div className="analytics-stat-icon analytics-purple">
                <Target size={20} />
              </div>

              <span>Completion rate</span>
              <strong>{data.completion_rate}%</strong>

              <small>Overall task progress</small>
            </article>


            <article className="analytics-stat-card">
              <div className="analytics-stat-icon analytics-orange">
                <Clock3 size={20} />
              </div>

              <span>Pending tasks</span>
              <strong>{data.pending_tasks}</strong>

              <small>Still waiting to be done</small>
            </article>

          </section>


          {/* PRODUCTIVITY PROGRESS */}

          <section className="analytics-progress-panel">

            <div className="analytics-progress-heading">
              <div>
                <h3>Your productivity</h3>

                <p>
                  How much of your task list have you completed?
                </p>
              </div>

              <strong>{data.completion_rate}%</strong>
            </div>


            <div className="analytics-progress-track">
              <div
                className="analytics-progress-fill"
                style={{
                  width: `${data.completion_rate}%`,
                }}
              />
            </div>


            <div className="analytics-progress-caption">
              <span>
                {data.completed_tasks} completed
              </span>

              <span>
                {Math.max(
                  0,
                  data.total_tasks - data.completed_tasks
                )} remaining
              </span>
            </div>

          </section>


          {/* ACTUAL TASK PROGRESS GRAPH */}

          <section className="analytics-panel analytics-productivity-panel">

            <div className="analytics-panel-heading">
              <div>
                <h3>Task Progress Overview</h3>

                <p>
                  Visualise your actual task completion and workload.
                </p>
              </div>

              <TrendingUp size={20} />
            </div>


            {data.total_tasks === 0 ? (
              <div className="analytics-chart-empty">
                Create your first task to see your progress.
              </div>
            ) : (
              <>

                <div className="analytics-progress-heading">
                  <span>Overall completion rate</span>

                  <strong>
                    {data.completion_rate}%
                  </strong>
                </div>


                <ResponsiveContainer
                  width="100%"
                  height={300}
                >
                  <BarChart
                    data={statusData}
                    margin={{
                      top: 20,
                      right: 20,
                      left: 0,
                      bottom: 10,
                    }}
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e9edf5"
                    />

                    <XAxis
                      dataKey="name"
                      tick={{
                        fontSize: 12,
                        fill: '#52617b',
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <YAxis
                      allowDecimals={false}
                      domain={[0, 'auto']}
                      tick={{
                        fontSize: 12,
                        fill: '#52617b',
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <Tooltip
                      contentStyle={{
                        borderRadius: 10,
                        border: '1px solid #e5e9f2',
                        color: '#303b52',
                        fontSize: 13,
                      }}
                    />

                    <Bar
                      dataKey="tasks"
                      name="Number of tasks"
                      radius={[7, 7, 0, 0]}
                      barSize={65}
                    >
                      <Cell fill="#65a98a" />
                      <Cell fill="#7184d7" />
                      <Cell fill="#e0a36d" />
                    </Bar>

                  </BarChart>
                </ResponsiveContainer>

                <p className="analytics-chart-note">
                  Based on your actual tasks stored in StudyMate.
                  The graph updates when you create, complete or
                  change the status of a task.
                </p>

              </>
            )}

          </section>


          {/* EXISTING ANALYTICS CHARTS */}

          <section className="analytics-chart-grid">


            {/* PRIORITY DISTRIBUTION */}

            <article className="analytics-panel">

              <div className="analytics-panel-heading">
                <div>
                  <h3>Priority distribution</h3>

                  <p>
                    Understand how your tasks are prioritised.
                  </p>
                </div>

                <Target size={19} />
              </div>


              {priorityData.length === 0 ? (
                <div className="analytics-chart-empty">
                  Add tasks to see priority distribution.
                </div>
              ) : (
                <ResponsiveContainer
                  width="100%"
                  height={260}
                >
                  <PieChart>

                    <Pie
                      data={priorityData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      outerRadius={82}
                      innerRadius={48}
                      paddingAngle={3}
                    >

                      {priorityData.map((item, index) => (
                        <Cell
                          key={item.name}
                          fill={
                            chartColors[
                              index % chartColors.length
                            ]
                          }
                        />
                      ))}

                    </Pie>

                    <Tooltip />

                    <Legend
                      wrapperStyle={{
                        fontSize: '12px',
                      }}
                    />

                  </PieChart>
                </ResponsiveContainer>
              )}

            </article>


            {/* CATEGORY DISTRIBUTION */}

            <article className="analytics-panel analytics-category-panel">

              <div className="analytics-panel-heading">
                <div>
                  <h3>Tasks by category</h3>

                  <p>
                    See where your time and effort are going.
                  </p>
                </div>

                <ListTodo size={19} />
              </div>


              {categoryData.length === 0 ? (
                <div className="analytics-chart-empty">
                  Add tasks to see category distribution.
                </div>
              ) : (
                <ResponsiveContainer
                  width="100%"
                  height={260}
                >
                  <BarChart
                    data={categoryData}
                    margin={{
                      top: 15,
                      right: 15,
                      left: -20,
                      bottom: 5,
                    }}
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#edf0f5"
                    />

                    <XAxis
                      dataKey="name"
                      tick={{
                        fontSize: 11,
                        fill: '#52617b',
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <YAxis
                      allowDecimals={false}
                      tick={{
                        fontSize: 11,
                        fill: '#52617b',
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <Tooltip />

                    <Bar
                      dataKey="value"
                      name="Tasks"
                      fill="#8d80c9"
                      radius={[6, 6, 0, 0]}
                    />

                  </BarChart>
                </ResponsiveContainer>
              )}

            </article>

          </section>


          {/* DOCUMENTS AND NOTES */}

          <section className="analytics-library-stats">

            <article>
              <div className="analytics-stat-icon analytics-blue">
                <FileText size={20} />
              </div>

              <div>
                <span>Uploaded documents</span>
                <strong>{data.total_documents}</strong>
              </div>
            </article>


            <article>
              <div className="analytics-stat-icon analytics-green">
                <NotebookPen size={20} />
              </div>

              <div>
                <span>Saved notes</span>
                <strong>{data.total_notes}</strong>
              </div>
            </article>

          </section>

        </>
      )}

    </div>
  )
}

export default Analytics
