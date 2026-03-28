import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { IoArrowBack, IoCamera, IoChevronForward, IoLogOut, IoStar, IoCheckmarkCircle, IoLockClosed, IoHelpCircle } from 'react-icons/io5'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { SERVICE_CATEGORIES, PAKISTAN_CITIES } from '../../types'
import type { WorkerProfile as WP } from '../../types'
import toast from 'react-hot-toast'

export default function WorkerProfilePage() {
  const nav = useNavigate()
  const { user, signOut, refreshUser } = useAuth()
  const [profile, setProfile] = useState<WP | null>(null)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    setName(user.name); setPhone(user.phone || ''); setCity(user.city || '')
    supabase.from('worker_profiles').select('*').eq('user_id', user.id).single().then(({ data }) => {
      if (data) { setProfile(data as WP); setSkills((data as WP).skills || []); setBio((data as WP).bio || '') }
    })
  }, [user])

  const toggleSkill = (s: string) => setSkills(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    await supabase.from('users').update({ name, phone, city }).eq('id', user.id)
    await supabase.from('worker_profiles').update({ skills, bio }).eq('user_id', user.id)
    await refreshUser()
    setSaving(false); setEditing(false)
    toast.success('Profile updated')
  }

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    const path = `avatars/${user.id}_${Date.now()}.jpg`
    await supabase.storage.from('avatars').upload(path, file)
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    await supabase.from('users').update({ profile_photo_url: data.publicUrl }).eq('id', user.id)
    await refreshUser()
    toast.success('Photo updated')
  }

  const handleChangePassword = async () => {
    const newPw = prompt('Enter new password (min 6 chars):')
    if (!newPw || newPw.length < 6) return toast.error('Password too short')
    const { error } = await supabase.auth.updateUser({ password: newPw })
    if (error) return toast.error(error.message)
    toast.success('Password changed')
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
      {/* Green header */}
      <div className="bg-primary px-6 pt-10 pb-6 rounded-b-3xl shadow-md">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => nav('/worker/dashboard')}>
            <IoArrowBack size={24} className="text-white" />
          </button>
          <h1 className="text-white text-xl font-medium">My Profile</h1>
        </div>

        {/* Avatar + info */}
        <div className="flex items-center gap-4 mb-5">
          <label className="cursor-pointer relative shrink-0">
            <div className="w-20 h-20 rounded-full border-4 border-white overflow-hidden bg-white/20 flex items-center justify-center">
              {user?.profile_photo_url
                ? <img src={user.profile_photo_url} className="w-full h-full object-cover" alt="avatar" />
                : <span className="text-3xl font-bold text-white">{user?.name?.[0] || 'W'}</span>}
            </div>
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow">
              <IoCamera size={13} className="text-primary" />
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </label>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-white text-lg font-semibold">{user?.name}</p>
              {user?.verified && <IoCheckmarkCircle size={18} className="text-white/90" />}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <IoStar size={14} className="text-yellow-300" />
              <span className="text-white/90 text-sm">{profile?.avg_rating?.toFixed(1) || '0.0'}</span>
              <span className="text-white/60 text-xs">({profile?.total_jobs || 0} jobs)</span>
            </div>
            <p className="text-white/70 text-xs mt-0.5">{user?.city || 'City not set'}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex gap-3">
          <div className="flex-1 bg-white/10 rounded-xl p-3">
            <p className="text-white/70 text-xs mb-1">Jobs Done</p>
            <p className="text-white text-lg font-semibold">{profile?.total_jobs || 0}</p>
          </div>
          <div className="flex-1 bg-white/10 rounded-xl p-3">
            <p className="text-white/70 text-xs mb-1">Avg Rating</p>
            <p className="text-white text-lg font-semibold">{profile?.avg_rating?.toFixed(1) || '0.0'}</p>
          </div>
          <div className="flex-1 bg-white/10 rounded-xl p-3">
            <p className="text-white/70 text-xs mb-1">Skills</p>
            <p className="text-white text-lg font-semibold">{profile?.skills?.length || 0}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-5 py-5 space-y-4 overflow-y-auto pb-8">
        {/* Details / Edit */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm font-semibold text-text-primary">Details</p>
            <button onClick={() => setEditing(!editing)} className="text-xs text-primary font-medium">{editing ? 'Cancel' : 'Edit'}</button>
          </div>
          {editing ? (
            <div className="space-y-3">
              <div><label className="text-xs text-text-muted">Name</label><input value={name} onChange={e => setName(e.target.value)} className="mt-1" /></div>
              <div><label className="text-xs text-text-muted">Phone</label><input value={phone} onChange={e => setPhone(e.target.value)} className="mt-1" /></div>
              <div><label className="text-xs text-text-muted">City</label>
                <select value={city} onChange={e => setCity(e.target.value)} className="mt-1">
                  <option value="">Select city</option>
                  {PAKISTAN_CITIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-text-muted">Skills</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {SERVICE_CATEGORIES.map(c => (
                    <button key={c.name} onClick={() => toggleSkill(c.name)}
                      className={`text-xs px-2 py-2 rounded-lg border transition ${skills.includes(c.name) ? 'border-primary bg-primary/5 text-primary' : 'border-border text-text-secondary'}`}>
                      {c.icon} {c.name}
                    </button>
                  ))}
                </div>
              </div>
              <div><label className="text-xs text-text-muted">Bio</label><textarea rows={3} value={bio} onChange={e => setBio(e.target.value)} className="resize-none mt-1" /></div>
              <button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-text-secondary">Name</span><span className="text-text-primary">{user?.name}</span></div>
              <div className="flex justify-between text-sm"><span className="text-text-secondary">Email</span><span className="text-text-primary text-xs">{user?.email}</span></div>
              <div className="flex justify-between text-sm"><span className="text-text-secondary">Phone</span><span className="text-text-primary">{user?.phone || '—'}</span></div>
              <div className="flex justify-between text-sm"><span className="text-text-secondary">City</span><span className="text-text-primary">{user?.city || '—'}</span></div>
              {profile?.skills && profile.skills.length > 0 && (
                <div>
                  <span className="text-sm text-text-secondary">Skills</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {profile.skills.map(s => <span key={s} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{s}</span>)}
                  </div>
                </div>
              )}
              {profile?.bio && <div><span className="text-sm text-text-secondary">Bio</span><p className="text-sm text-text-primary mt-1">{profile.bio}</p></div>}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <button onClick={() => nav('/worker/reviews')} className="w-full flex items-center justify-between px-5 py-3.5 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"><IoStar size={18} className="text-text-muted" /></div>
              <div className="text-left"><p className="text-sm font-medium text-text-primary">My Reviews</p><p className="text-xs text-text-muted">See customer feedback</p></div>
            </div>
            <IoChevronForward className="text-text-muted" />
          </button>
          <button onClick={handleChangePassword} className="w-full flex items-center justify-between px-5 py-3.5 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"><IoLockClosed size={17} className="text-text-muted" /></div>
              <div className="text-left"><p className="text-sm font-medium text-text-primary">Change Password</p><p className="text-xs text-text-muted">Update your password</p></div>
            </div>
            <IoChevronForward className="text-text-muted" />
          </button>
          <button className="w-full flex items-center justify-between px-5 py-3.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"><IoHelpCircle size={19} className="text-text-muted" /></div>
              <div className="text-left"><p className="text-sm font-medium text-text-primary">Help & Support</p><p className="text-xs text-text-muted">FAQs and contact</p></div>
            </div>
            <IoChevronForward className="text-text-muted" />
          </button>
        </div>

        {/* Logout */}
        <button
          onClick={async () => { await signOut(); nav('/login') }}
          className="w-full flex items-center justify-center gap-2 bg-white border border-red-200 text-red-500 py-4 rounded-2xl text-sm font-medium shadow-sm"
        >
          <IoLogOut size={18} /> Logout
        </button>
      </div>
    </div>
  )
}
