import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IoLogoGoogle, IoCall, IoMail, IoLockClosed, IoPerson } from 'react-icons/io5'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

type AuthTab = 'login' | 'signup'
type LoginMethod = 'email' | 'phone'
type PhoneStep = 'input' | 'otp'

export default function Login() {
  const nav = useNavigate()
  const [activeTab, setActiveTab] = useState<AuthTab>('login')
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('email')

  // Login fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [phoneStep, setPhoneStep] = useState<PhoneStep>('input')
  const [loading, setLoading] = useState(false)

  const handleEmailLogin = async () => {
    if (!email || !password) return toast.error('Please enter email and password')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) return toast.error(error.message)
  }

  const handleSendOTP = async () => {
    let formatted = phone.trim()
    if (formatted.startsWith('0')) formatted = '+92' + formatted.slice(1)
    else if (!formatted.startsWith('+')) formatted = '+92' + formatted
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({ phone: formatted })
    setLoading(false)
    if (error) return toast.error(error.message)
    toast.success('OTP sent!')
    setPhoneStep('otp')
  }

  const handleVerifyOTP = async () => {
    let formatted = phone.trim()
    if (formatted.startsWith('0')) formatted = '+92' + formatted.slice(1)
    else if (!formatted.startsWith('+')) formatted = '+92' + formatted
    setLoading(true)
    const { error } = await supabase.auth.verifyOtp({ phone: formatted, token: otp, type: 'sms' })
    setLoading(false)
    if (error) return toast.error(error.message)
  }

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/customer/home' },
    })
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Green Header */}
      <div className="bg-primary px-6 pt-12 pb-8 rounded-b-3xl text-center">
        <img src="/logo.png" alt="KarigarGo" className="w-16 h-16 mx-auto mb-2 rounded-2xl" />
        <p className="text-white/80 text-sm mt-1">Har Kaam Ka Karigar, Bas Ek Tap Dur</p>

        {/* Role Toggle — Customer / Worker */}
        <div className="flex gap-3 mt-6">
          <div className="flex-1 bg-white/15 border border-white/30 rounded-2xl py-3.5 px-3">
            <p className="text-white font-semibold text-sm">Customer</p>
            <p className="text-white/60 text-xs mt-0.5">Hire workers</p>
          </div>
          <button
            onClick={() => nav('/login/worker')}
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-3.5 px-3 text-left hover:bg-white/10 transition"
          >
            <p className="text-white/60 font-medium text-sm">Worker</p>
            <p className="text-white/40 text-xs mt-0.5">Find jobs</p>
          </button>
        </div>
      </div>

      {/* Form Container */}
      <div className="flex-1 px-6 pt-6 pb-8 overflow-y-auto">
        {/* Login / Signup tabs */}
        <div className="flex bg-surface rounded-xl p-1 mb-6">
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${
              activeTab === 'login' ? 'bg-white shadow-sm text-primary' : 'text-text-muted'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setActiveTab('signup')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${
              activeTab === 'signup' ? 'bg-white shadow-sm text-primary' : 'text-text-muted'
            }`}
          >
            Sign Up
          </button>
        </div>

        {activeTab === 'login' ? (
          <div className="space-y-4 animate-fade-in">
            {/* Email / Phone sub-tabs */}
            <div className="flex gap-2 mb-2">
              <button
                onClick={() => { setLoginMethod('email'); setPhoneStep('input') }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium border transition ${
                  loginMethod === 'email' ? 'border-primary text-primary bg-primary/5' : 'border-border text-text-muted'
                }`}
              >
                <IoMail size={14} /> Email
              </button>
              <button
                onClick={() => setLoginMethod('phone')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium border transition ${
                  loginMethod === 'phone' ? 'border-primary text-primary bg-primary/5' : 'border-border text-text-muted'
                }`}
              >
                <IoCall size={14} /> Phone
              </button>
            </div>

            {loginMethod === 'email' ? (
              <>
                <div>
                  <label className="text-sm font-medium text-text-primary mb-1.5 block">Email</label>
                  <div className="relative">
                    <IoMail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} className="!pl-10" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-text-primary mb-1.5 block">Password</label>
                  <div className="relative">
                    <IoLockClosed size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input type="password" placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)} className="!pl-10" />
                  </div>
                </div>
                <p className="text-sm text-primary font-medium text-right cursor-pointer">Forgot Password?</p>
                <button onClick={handleEmailLogin} disabled={loading} className="btn-primary">
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </>
            ) : phoneStep === 'input' ? (
              <>
                <div>
                  <label className="text-sm font-medium text-text-primary mb-1.5 block">Phone Number</label>
                  <div className="relative">
                    <IoCall size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input type="tel" placeholder="03XX-XXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} className="!pl-10" />
                  </div>
                </div>
                <button onClick={handleSendOTP} disabled={loading} className="btn-primary">
                  {loading ? 'Sending...' : 'Send OTP'}
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-text-secondary text-center">Code sent to <strong>{phone}</strong></p>
                <input type="text" placeholder="Enter 6-digit code" maxLength={6} value={otp} onChange={e => setOtp(e.target.value)} className="text-center text-lg tracking-[0.5em]" />
                <button onClick={handleVerifyOTP} disabled={loading} className="btn-primary">
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
                <button onClick={() => setPhoneStep('input')} className="text-sm text-primary text-center w-full">Change number</button>
              </>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-text-muted">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Google */}
            <button onClick={handleGoogle} className="btn-ghost flex items-center justify-center gap-3">
              <IoLogoGoogle size={18} className="text-[#4285F4]" />
              Sign in with Google
            </button>
          </div>
        ) : (
          /* Signup tab — just redirects to signup pages */
          <div className="space-y-4 animate-fade-in text-center py-6">
            <p className="text-text-secondary text-sm mb-6">Create a new account to get started</p>
            <button onClick={() => nav('/signup/customer')} className="btn-primary">
              Customer Registration
            </button>
            <p className="text-xs text-text-muted pt-2">
              Are you a worker?{' '}
              <button onClick={() => nav('/signup/worker')} className="text-primary font-medium">Register here</button>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
