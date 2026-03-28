import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { IoArrowBack } from 'react-icons/io5'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import ChatWindow from '../components/ChatWindow'
import type { Job } from '../types'

export default function ChatPage() {
  const nav = useNavigate()
  const { jobId } = useParams<{ jobId: string }>()
  const { user } = useAuth()
  const [job, setJob] = useState<Job | null>(null)

  useEffect(() => {
    if (!jobId) return
    supabase
      .from('jobs')
      .select('id, title, worker_name, customer_name, worker_id, customer_id, status')
      .eq('id', jobId)
      .single()
      .then(({ data }) => { if (data) setJob(data as Job) })
  }, [jobId])

  const otherName = user?.role === 'customer'
    ? (job?.worker_name || 'Worker')
    : (job?.customer_name || 'Customer')

  return (
    <div className="min-h-screen bg-surface flex flex-col" style={{ height: '100dvh' }}>
      <div className="top-bar flex items-center gap-3 shrink-0">
        <button onClick={() => nav(-1)}>
          <IoArrowBack size={22} className="text-white" />
        </button>
        <div>
          <h1 className="text-base font-semibold text-white leading-tight">{job?.title || 'Chat'}</h1>
          <p className="text-white/70 text-xs">{otherName}</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        {jobId && (
          <ChatWindow jobId={jobId} otherUserName={otherName} fullScreen />
        )}
      </div>
    </div>
  )
}
