import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { IoArrowBack, IoCall, IoChatbubble, IoCheckmarkCircle } from 'react-icons/io5'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import type { Job } from '../../types'
import toast from 'react-hot-toast'

type TabKey = 'active' | 'completed'

export default function MyBids() {
  const nav = useNavigate()
  const { user } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [tab, setTab] = useState<TabKey>('active')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const fetchJobs = async () => {
      // Get jobs assigned to this worker (bid accepted or ongoing)
      const { data } = await supabase
        .from('jobs')
        .select('*')
        .eq('worker_id', user.id)
        .order('updated_at', { ascending: false })
      if (data) setJobs(data as Job[])
      setLoading(false)
    }
    fetchJobs()
  }, [user])

  const activeJobs = jobs.filter(j => j.status !== 'completed' && j.status !== 'cancelled')
  const completedJobs = jobs.filter(j => j.status === 'completed')

  const displayed = tab === 'active' ? activeJobs : completedJobs

  const statusBadge = (s: string) => {
    if (s === 'bidAccepted') return <span className="text-xs font-medium px-2 py-1 rounded-lg bg-blue-100 text-blue-700">Accepted</span>
    if (s === 'inspectionDone') return <span className="text-xs font-medium px-2 py-1 rounded-lg bg-purple-100 text-purple-700">Inspected</span>
    if (s === 'workCostProposed') return <span className="text-xs font-medium px-2 py-1 rounded-lg bg-yellow-100 text-yellow-700">Cost Sent</span>
    if (s === 'workCostAccepted') return <span className="text-xs font-medium px-2 py-1 rounded-lg bg-green-100 text-primary">In Progress</span>
    return <span className="text-xs font-medium px-2 py-1 rounded-lg bg-gray-100 text-text-muted">{s}</span>
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
      {/* Green header */}
      <div className="bg-primary px-6 pt-10 pb-5 rounded-b-3xl shadow-md">
        <div className="flex items-center gap-4">
          <button onClick={() => nav('/worker/dashboard')}><IoArrowBack size={24} className="text-white" /></button>
          <h1 className="text-white text-xl font-medium">My Jobs</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white mx-5 mt-5 rounded-xl p-1 shadow-sm">
        {(['active', 'completed'] as TabKey[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition ${tab === t ? 'bg-primary text-white' : 'text-text-muted'}`}>
            {t === 'active' ? `In Progress (${activeJobs.length})` : `Completed (${completedJobs.length})`}
          </button>
        ))}
      </div>

      <div className="flex-1 px-5 py-4 space-y-4 overflow-y-auto pb-8">
        {loading ? (
          <p className="text-center text-sm text-text-muted py-8">Loading...</p>
        ) : displayed.length === 0 ? (
          <p className="text-center text-sm text-text-muted py-8">
            {tab === 'active' ? 'No active jobs right now' : 'No completed jobs yet'}
          </p>
        ) : (
          displayed.map(job => (
            <div key={job.id} className="bg-white rounded-2xl shadow-sm p-4">
              {/* Header row */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-sm font-semibold text-text-primary">{job.title}</p>
                    {tab === 'active' && statusBadge(job.status)}
                  </div>
                  <p className="text-xs text-text-muted">{job.customer_name}</p>
                  <p className="text-xs text-text-muted mt-0.5">{job.location}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-primary">
                    PKR {((job.inspection_charges || 0) + (job.work_cost || 0)).toLocaleString()}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {new Date(job.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Completed — show star rating if reviewed */}
              {tab === 'completed' && (
                <div className="flex items-center gap-1 mb-3">
                  {[1,2,3,4,5].map(i => (
                    <span key={i} className={`text-base ${i <= 5 ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                  ))}
                  <span className="text-xs text-text-muted ml-1">Job completed</span>
                </div>
              )}

              {/* Active — action buttons */}
              {tab === 'active' && (
                <div className="flex gap-2 pt-3 border-t border-border">
                  <button
                    onClick={() => toast('Calling feature coming soon')}
                    className="flex-1 flex items-center justify-center gap-1.5 border border-border py-2.5 rounded-xl text-xs font-medium text-text-primary"
                  >
                    <IoCall size={14} className="text-primary" /> Call
                  </button>
                  <button
                    onClick={() => nav(`/chat/${job.id}`)}
                    className="flex-1 flex items-center justify-center gap-1.5 border border-border py-2.5 rounded-xl text-xs font-medium text-text-primary"
                  >
                    <IoChatbubble size={14} className="text-primary" /> Chat
                  </button>
                  <button
                    onClick={() => nav(`/worker/active-job/${job.id}`)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-white py-2.5 rounded-xl text-xs font-medium"
                  >
                    <IoCheckmarkCircle size={14} /> View Job
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
