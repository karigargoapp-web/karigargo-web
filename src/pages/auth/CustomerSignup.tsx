import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { IoArrowBack, IoCamera, IoLogoGoogle, IoCheckmarkCircle, IoCloudUpload } from 'react-icons/io5'
import { supabase } from '../../lib/supabase'
import { emailRedirect } from '../../lib/authRedirect'
import { PAKISTAN_CITIES } from '../../types'
import {
  formatCNICDisplay,
  PASSWORD_HINT,
  validateCNIC,
  validateEmail,
  validateImageFile,
  validatePassword,
  validatePersonName,
} from '../../lib/validation'
import toast from 'react-hot-toast'

export default function CustomerSignup() {
  const nav = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [city, setCity] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [cnic, setCnic] = useState('')
  const [cnicFront, setCnicFront] = useState<File | null>(null)
  const [cnicBack, setCnicBack] = useState<File | null>(null)
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

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: emailRedirect('/customer/home') },
    })
    if (error) toast.error(error.message)
  }

  const uploadFile = async (file: File, folder: string) => {
    const path = `${folder}/${Date.now()}_${file.name}`
    await supabase.storage.from('signup-docs').upload(path, file)
    const { data } = supabase.storage.from('signup-docs').getPublicUrl(path)
    return data.publicUrl
  }

  const handleSubmit = async () => {
    const fieldErr =
      validatePersonName(name) ||
      validateEmail(email) ||
      validatePassword(password) ||
      validateCNIC(cnic) ||
      validateImageFile(cnicFront, { required: true }) ||
      validateImageFile(cnicBack, { required: true })
    if (fieldErr) return toast.error(fieldErr)
    if (photo) {
      const pe = validateImageFile(photo, { required: false })
      if (pe) return toast.error(pe)
    }
    if (submitLockRef.current) return
    submitLockRef.current = true
    setLoading(true)

    const cnicFormatted = formatCNICDisplay(cnic)

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: emailRedirect('/customer/home') },
      })
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

      const cnicFrontUrl = await uploadFile(cnicFront!, 'cnic')
      const cnicBackUrl = await uploadFile(cnicBack!, 'cnic')

      const { error: insertErr } = await supabase.rpc('handle_signup_user', {
        p_id: userId,
        p_name: name,
        p_email: email,
        p_phone: null,
        p_role: 'customer',
        p_city: city || null,
        p_profile_photo_url: photoUrl || null,
        p_verified: false,
      })
      if (insertErr) throw insertErr

      const { error: cnicUpdateErr } = await supabase
        .from('users')
        .update({
          cnic: cnicFormatted,
          cnic_front_url: cnicFrontUrl,
          cnic_back_url: cnicBackUrl,
        })
        .eq('id', userId)
      if (cnicUpdateErr) {
        console.warn('CNIC fields update:', cnicUpdateErr.message)
      }

      setIsSubmitted(true)
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Could not finish signup. Try again.'
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
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Check your email</h2>
        <p className="text-text-secondary text-sm mb-8">
          We've sent a verification link to
          <br /> <span className="font-semibold text-text-primary">{email}</span>.
          <br />
          <br />
          Click the link in the email to activate your account.
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
        <button onClick={() => nav('/login')}>
          <IoArrowBack size={22} className="text-white" />
        </button>
        <h1 className="text-lg font-semibold text-white">Create Customer Account</h1>
      </div>

      <div className="flex-1 px-6 py-6 space-y-5 overflow-y-auto pb-10">
        <button
          onClick={handleGoogle}
          className="btn-ghost flex items-center justify-center gap-3 w-full"
        >
          <IoLogoGoogle size={18} className="text-[#4285F4]" />
          Sign up with Google
        </button>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-text-muted">or create with email</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Profile Photo */}
        <div className="flex justify-center">
          <label className="cursor-pointer">
            <div className="w-24 h-24 rounded-full bg-surface border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
              {photoPreview ? (
                <img src={photoPreview} className="w-full h-full object-cover" />
              ) : (
                <IoCamera size={28} className="text-text-muted" />
              )}
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            <p className="text-xs text-primary text-center mt-2">Upload Photo</p>
          </label>
        </div>

        <div>
          <label className="text-sm text-text-secondary mb-1.5 block">Full Name *</label>
          <input
            placeholder="Enter your name"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={80}
            autoComplete="name"
          />
        </div>
        <div>
          <label className="text-sm text-text-secondary mb-1.5 block">Email *</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm text-text-secondary mb-1.5 block">Password *</label>
          <input
            type="password"
            placeholder="Create a password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="new-password"
          />
          <p className="text-[11px] text-text-muted mt-1 leading-snug">{PASSWORD_HINT}</p>
        </div>
        <div>
          <label className="text-sm text-text-secondary mb-1.5 block">City</label>
          <select
            value={city}
            onChange={e => setCity(e.target.value)}
            className={!city ? 'text-text-muted' : ''}
          >
            <option value="">Select city</option>
            {PAKISTAN_CITIES.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* CNIC Section */}
        <div className="bg-surface rounded-2xl p-4 space-y-4">
          <p className="text-sm font-semibold text-text-primary">CNIC Verification *</p>
          <div>
            <label className="text-sm text-text-secondary mb-1.5 block">CNIC Number *</label>
            <input
              placeholder="12345-1234567-1"
              value={cnic}
              onChange={e => setCnic(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="cursor-pointer">
              <div
                className={`h-28 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition ${
                  cnicFront ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                {cnicFront ? (
                  <IoCheckmarkCircle size={28} className="text-primary" />
                ) : (
                  <IoCloudUpload size={28} className="text-text-muted" />
                )}
                <span className="text-xs text-text-secondary">
                  {cnicFront ? 'Front ✓' : 'CNIC Front *'}
                </span>
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => setCnicFront(e.target.files?.[0] || null)}
              />
            </label>
            <label className="cursor-pointer">
              <div
                className={`h-28 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition ${
                  cnicBack ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                {cnicBack ? (
                  <IoCheckmarkCircle size={28} className="text-primary" />
                ) : (
                  <IoCloudUpload size={28} className="text-text-muted" />
                )}
                <span className="text-xs text-text-secondary">
                  {cnicBack ? 'Back ✓' : 'CNIC Back *'}
                </span>
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => setCnicBack(e.target.files?.[0] || null)}
              />
            </label>
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading} className="btn-primary !mt-8">
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>

        <p className="text-center text-sm text-text-secondary mt-4">
          Already have an account?{' '}
          <button onClick={() => nav('/login')} className="text-primary font-medium">
            Login
          </button>
        </p>
      </div>
    </div>
  )
}
