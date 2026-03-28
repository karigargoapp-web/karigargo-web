import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IoLogoGoogle, IoMail, IoLockClosed, IoEyeOutline, IoEyeOffOutline, IoCall } from 'react-icons/io5'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

type AuthTab = 'login' | 'signup'
type PhoneStep = 'input' | 'otp'

export default function WorkerLogin() {
  const nav = useNavigate()
  const [activeTab, setActiveTab] = useState<AuthTab>('login')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [phoneStep, setPhoneStep] = useState<PhoneStep>('input')
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [showResend, setShowResend] = useState(false)
  const [usePhone, setUsePhone] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) return toast.error('Please enter email and password')
    setLoading(true)
    setShowResend(false)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      const msg = error.message?.toLowerCase() || ''
      if (msg.includes('invalid') || msg.includes('credentials') || msg.includes('not found')) {
        setShowResend(true)
        toast.error('Invalid credentials. If you just registered, confirm your email first.')
      } else if (msg.includes('email not confirmed')) {
        setShowResend(true)
        toast.error('Please confirm your email before logging in.')
      } else {
        toast.error(error.message)
      }
    }
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

  const handleResend = async () => {
    if (!email) return toast.error('Enter your email above first')
    setResendLoading(true)
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    setResendLoading(false)
    if (error) toast.error(error.message)
    else toast.success('Confirmation email resent!')
  }

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/worker/dashboard' },
    })
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Green Header */}
      <div className="bg-primary px-6 pt-12 pb-8 rounded-b-3xl text-center">
        <img src="/logo.png" alt="KarigarGo" className="w-16 h-16 mx-auto mb-2 rounded-2xl" />
        <p className="text-white/80 text-sm mt-1">Agla Kaam, Bas Ek Tap Dur</p>

        {/* Role Toggle — Customer / Worker */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => nav('/login')}
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-3.5 px-3 text-left hover:bg-white/10 transition"
          >
            <p className="text-white/60 font-medium text-sm">Customer</p>
            <p className="text-white/40 text-xs mt-0.5">Hire workers</p>
          </button>
          <div className="flex-1 bg-white/15 border border-white/30 rounded-2xl py-3.5 px-3">
            <p className="text-white font-semibold text-sm">Worker</p>
            <p className="text-white/60 text-xs mt-0.5">Find jobs</p>
          </div>
        </div>
      </div>

      {/* Form */}
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
            {!usePhone ? (
              <>
                <div>
                  <label className="text-sm font-medium text-text-primary mb-1.5 block">Email</label>
                  <div className="relative">
                    <IoMail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input type="email" placeholder="Enter your email" value={email} onChange={e => { setEmail(e.target.value); setShowResend(false) }} className="!pl-10" onKeyDown={e => e.key === 'Enter' && handleLogin()} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-text-primary mb-1.5 block">Password</label>
                  <div className="relative">
                    <IoLockClosed size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input type={showPassword ? 'text' : 'password'} placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)} className="!pl-10 !pr-10" onKeyDown={e => e.key === 'Enter' && handleLogin()} />
                    <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted">
                      {showPassword ? <IoEyeOffOutline size={18} /> : <IoEyeOutline size={18} />}
                    </button>
                  </div>
                </div>
                <p className="text-sm text-primary font-medium text-right cursor-pointer">Forgot Password?</p>
                <button onClick={handleLogin} disabled={loading} className="btn-primary">
                  {loading ? 'Signing in…' : 'Login'}
                </button>
                <button onClick={() => setUsePhone(true)} className="text-sm text-primary text-center w-full mt-1">
                  Login with Phone instead
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
                <button onClick={handleSendOTP} disabled={loading} className="btn-primary">{loading ? 'Sending...' : 'Send OTP'}</button>
                <button onClick={() => setUsePhone(false)} className="text-sm text-primary text-center w-full">Use Email instead</button>
              </>
            ) : (
              <>
                <p className="text-sm text-text-secondary text-center">Code sent to <strong>{phone}</strong></p>
                <input type="text" placeholder="Enter 6-digit code" maxLength={6} value={otp} onChange={e => setOtp(e.target.value)} className="text-center text-lg tracking-[0.5em]" />
                <button onClick={handleVerifyOTP} disabled={loading} className="btn-primary">{loading ? 'Verifying...' : 'Verify OTP'}</button>
                <button onClick={() => setPhoneStep('input')} className="text-sm text-primary text-center w-full">Change number</button>
              </>
            )}

            {showResend && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 animate-fade-in">
                <p className="text-sm text-amber-800 font-medium mb-1">Haven't confirmed your email?</p>
                <p className="text-xs text-amber-700 mb-3">Click the link in the confirmation email before signing in.</p>
                <button type="button" onClick={handleResend} disabled={resendLoading} className="text-sm font-semibold text-amber-800 underline disabled:opacity-50">
                  {resendLoading ? 'Sending…' : 'Resend confirmation email'}
                </button>
              </div>
            )}

            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-text-muted">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <button onClick={handleGoogle} className="btn-ghost flex items-center justify-center gap-3">
              <IoLogoGoogle size={18} className="text-[#4285F4]" />
              Sign in with Google
            </button>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in text-center py-6">
            <p className="text-text-secondary text-sm mb-6">Create your worker account to start getting jobs</p>
            <button onClick={() => nav('/signup/worker')} className="btn-primary">
              Worker Registration
            </button>
            <p className="text-xs text-text-muted pt-2">
              Are you a customer?{' '}
              <button onClick={() => nav('/signup/customer')} className="text-primary font-medium">Register here</button>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
