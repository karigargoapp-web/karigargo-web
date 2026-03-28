import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { IoArrowBack, IoCamera, IoChevronForward, IoLogOut, IoPerson, IoLockClosed, IoNotifications, IoHelpCircle } from 'react-icons/io5'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { PAKISTAN_CITIES } from '../../types'
import toast from 'react-hot-toast'

export default function CustomerProfile() {
  const nav = useNavigate()
  const { user, signOut, refreshUser } = useAuth()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [city, setCity] = useState(user?.city || '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) { setName(user.name); setPhone(user.phone || ''); setCity(user.city || '') }
  }, [user])

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    await supabase.from('users').update({ name, phone, city }).eq('id', user.id)
    await refreshUser()
    setSaving(false)
    setEditing(false)
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

  const handleLogout = async () => {
    await signOut()
    nav('/login')
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
      {/* Green header */}
      <div className="bg-primary px-6 pt-10 pb-6 rounded-b-3xl shadow-md">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => nav('/customer/home')}>
            <IoArrowBack size={24} className="text-white" />
          </button>
          <h1 className="text-white text-xl font-medium">Profile</h1>
        </div>

        {/* Avatar + info */}
        <div className="flex items-center gap-4">
          <label className="cursor-pointer relative shrink-0">
            <div className="w-20 h-20 rounded-full border-4 border-white overflow-hidden bg-white/20 flex items-center justify-center">
              {user?.profile_photo_url
                ? <img src={user.profile_photo_url} className="w-full h-full object-cover" alt="avatar" />
                : <span className="text-3xl font-bold text-white">{user?.name?.[0] || 'U'}</span>}
            </div>
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow">
              <IoCamera size={13} className="text-primary" />
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </label>
          <div className="flex-1">
            <p className="text-white text-lg font-semibold">{user?.name}</p>
            <p className="text-white/70 text-sm mt-0.5">{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-5 py-5 space-y-4 overflow-y-auto pb-8">
        {/* Personal Info section */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <p className="text-sm font-semibold text-text-primary px-5 pt-4 pb-3">Personal Info</p>

          {editing ? (
            <div className="px-5 pb-5 space-y-3 border-t border-border pt-3">
              <div><label className="text-xs text-text-muted">Name</label><input value={name} onChange={e => setName(e.target.value)} className="mt-1" /></div>
              <div><label className="text-xs text-text-muted">Phone</label><input value={phone} onChange={e => setPhone(e.target.value)} className="mt-1" /></div>
              <div><label className="text-xs text-text-muted">City</label>
                <select value={city} onChange={e => setCity(e.target.value)} className="mt-1">
                  <option value="">Select city</option>
                  {PAKISTAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setEditing(false)} className="btn-ghost flex-1">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </div>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                className="w-full flex items-center justify-between px-5 py-3.5 border-b border-border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <IoPerson size={18} className="text-text-muted" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-text-primary">Personal Info</p>
                    <p className="text-xs text-text-muted">Name, phone, city</p>
                  </div>
                </div>
                <IoChevronForward className="text-text-muted" />
              </button>

              <button
                onClick={handleChangePassword}
                className="w-full flex items-center justify-between px-5 py-3.5 border-b border-border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <IoLockClosed size={17} className="text-text-muted" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-text-primary">Change Password</p>
                    <p className="text-xs text-text-muted">Update your password</p>
                  </div>
                </div>
                <IoChevronForward className="text-text-muted" />
              </button>
            </>
          )}
        </div>

        {/* Preferences */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <p className="text-sm font-semibold text-text-primary px-5 pt-4 pb-1">Preferences</p>
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <IoNotifications size={18} className="text-text-muted" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">Notifications</p>
                <p className="text-xs text-text-muted">Receive job updates</p>
              </div>
            </div>
            {/* Simple visual toggle */}
            <div className="w-11 h-6 bg-primary rounded-full flex items-center justify-end pr-0.5">
              <div className="w-5 h-5 bg-white rounded-full shadow" />
            </div>
          </div>
        </div>

        {/* Support */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <p className="text-sm font-semibold text-text-primary px-5 pt-4 pb-1">Support</p>
          <button className="w-full flex items-center justify-between px-5 py-3.5 border-t border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <IoHelpCircle size={19} className="text-text-muted" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-text-primary">Help & Support</p>
                <p className="text-xs text-text-muted">FAQs and contact</p>
              </div>
            </div>
            <IoChevronForward className="text-text-muted" />
          </button>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-white border border-red-200 text-red-500 py-4 rounded-2xl text-sm font-medium shadow-sm"
        >
          <IoLogOut size={18} /> Logout
        </button>
      </div>
    </div>
  )
}
