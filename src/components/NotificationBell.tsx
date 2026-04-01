import { useState, useEffect } from 'react'
import { IoNotifications } from 'react-icons/io5'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { getBrowserNotificationPermission, showBrowserNotification } from '../lib/browserNotifications'
import toast from 'react-hot-toast'
import type { Notification } from '../types'

export default function NotificationBell({ showBadgeOnly = false }: { showBadgeOnly?: boolean }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const unread = notifications.filter(n => !n.read).length

  useEffect(() => {
    if (!user) return
    const fetch = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)
      if (data) setNotifications(data as Notification[])
    }
    fetch()

    const channel = supabase
      .channel(`notif-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const row = payload.new as Notification
          setNotifications(prev => [row, ...prev].slice(0, 10))
          
          // Show toast popup if user is on the page
          if (document.visibilityState === 'visible') {
            toast.custom((t) => (
              <div
                className={`${
                  t.visible ? 'animate-enter' : 'animate-leave'
                } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
              >
                <div className="flex-1 w-0 p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 pt-0.5">
                      <IoNotifications className="h-5 w-5 text-primary" />
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900">{row.title}</p>
                      <p className="mt-1 text-sm text-gray-500">{row.body}</p>
                    </div>
                  </div>
                </div>
                <div className="flex border-l border-gray-200">
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-primary hover:text-primary-dark focus:outline-none"
                  >
                    Close
                  </button>
                </div>
              </div>
            ), { duration: 5000, position: 'top-right' })
          }
          
          // Show browser notification if page is hidden
          if (
            document.visibilityState === 'hidden' &&
            getBrowserNotificationPermission() === 'granted'
          ) {
            showBrowserNotification(row.title, { body: row.body, tag: row.id })
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user])

  const markAllRead = async () => {
    if (!user) return
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const handleToggle = () => {
    if (!open) markAllRead()
    setOpen(!open)
  }

  // Badge-only mode for Messages button
  if (showBadgeOnly) {
    return unread > 0 ? (
      <span className="absolute -top-1 -right-1 w-4 h-4 bg-danger text-white text-[9px] font-bold rounded-full flex items-center justify-center z-10">
        {unread > 9 ? '9+' : unread}
      </span>
    ) : null
  }

  // Full notification bell for top bar
  return (
    <div className="relative">
      <button onClick={handleToggle} className="relative p-1">
        <IoNotifications size={20} className="text-white" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-danger text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 w-72 bg-white rounded-card shadow-lg border border-border z-50 animate-fade-in overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-sm font-semibold text-text-primary">Notifications</p>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-6">No notifications yet</p>
              ) : notifications.map(n => (
                <div key={n.id} className={`px-4 py-3 border-b border-border last:border-0 ${!n.read ? 'bg-primary/5' : ''}`}>
                  <p className="text-sm text-text-primary font-medium">{n.title}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{n.body}</p>
                  <p className="text-[10px] text-text-muted mt-1">{new Date(n.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
