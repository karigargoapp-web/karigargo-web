import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { IoArrowBack, IoCamera } from 'react-icons/io5'
import { supabase } from '../../lib/supabase'
import { PAKISTAN_CITIES } from '../../types'
import toast from 'react-hot-toast'

export default function CustomerSignup() {
  const nav = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [city, setCity] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const submitLockRef = useRef(false)

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhoto(file)
      setPhotoPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async () => {
    if (!name || !email || !password) return toast.error('Name, email and password are required')
    if (submitLockRef.current) return
    submitLockRef.current = true
    setLoading(true)

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password })
      if (authError) {
        const msg = authError.message?.toLowerCase() || ''
        if (msg.includes('rate') || msg.includes('too many')) {
          toast.error('Too many signup attempts. Please wait a few minutes and try again.')
        } else {
          toast.error(authError.message)
        }
        return
      }
      const userId = authData.user?.id ?? null
      if (!userId) {
        toast.error('Signup failed — could not get user ID')
        return
      }

      let photoUrl = ''
      if (photo) {
        const path = `avatars/${userId}_${Date.now()}.jpg`
        const { error: upErr } = await supabase.storage.from('avatars').upload(path, photo)
        if (upErr) throw upErr
        const { data } = supabase.storage.from('avatars').getPublicUrl(path)
        photoUrl = data.publicUrl
      }

      let formatted = phone.trim()
      if (formatted && formatted.startsWith('0')) formatted = '+92' + formatted.slice(1)

      const { error: insertErr } = await supabase.rpc('handle_signup_user', {
        p_id: userId,
        p_name: name,
        p_email: email,
        p_phone: formatted || null,
        p_role: 'customer',
        p_city: city || null,
        p_profile_photo_url: photoUrl || null,
        p_verified: false,
      })
      if (insertErr) throw insertErr

      setIsSubmitted(true)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not finish signup. Try again — we will not resend email if your account was already created.'
      toast.error(message)
    } finally {
      setLoading(false)
      submitLockRef.current = false
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6 text-center animate-fade-in">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
          <IoArrowBack className="hidden" /> {/* Force import to stay valid if unused later */}
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Check your email</h2>
        <p className="text-text-secondary text-sm mb-8">
          We've sent a verification link to<br/> <span className="font-semibold text-text-primary">{email}</span>. 
          <br/><br/>
          Click the link in the email to activate your account. You will be logged in automatically!
        </p>
        <button onClick={() => nav('/login')} className="text-sm font-medium text-primary">
          Back to Login
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="top-bar flex items-center gap-3">
        <button onClick={() => nav('/login')}><IoArrowBack size={22} className="text-white" /></button>
        <h1 className="text-lg font-semibold text-white">Create Customer Account</h1>
      </div>

      <div className="flex-1 px-6 py-6 space-y-5">
        {/* Photo */}
        <div className="flex justify-center">
          <label className="cursor-pointer">
            <div className="w-24 h-24 rounded-full bg-surface border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
              {photoPreview ? <img src={photoPreview} className="w-full h-full object-cover" /> : <IoCamera size={28} className="text-text-muted" />}
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            <p className="text-xs text-primary text-center mt-2">Upload Photo</p>
          </label>
        </div>

        <div>
          <label className="text-sm text-text-secondary mb-1.5 block">Full Name *</label>
          <input placeholder="Enter your name" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-text-secondary mb-1.5 block">Email *</label>
          <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-text-secondary mb-1.5 block">Phone Number</label>
          <input type="tel" placeholder="03001234567" value={phone} onChange={e => setPhone(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-text-secondary mb-1.5 block">Password *</label>
          <input type="password" placeholder="Create a password" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-text-secondary mb-1.5 block">City</label>
          <select value={city} onChange={e => setCity(e.target.value)} className={!city ? 'text-text-muted' : ''}>
            <option value="">Select city</option>
            {PAKISTAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <button onClick={handleSubmit} disabled={loading} className="btn-primary !mt-8">
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>

        <p className="text-center text-sm text-text-secondary mt-4">
          Already have an account? <button onClick={() => nav('/login')} className="text-primary font-medium">Login</button>
        </p>
      </div>
    </div>
  )
}
