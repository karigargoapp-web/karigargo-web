import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IoArrowBack, IoCheckmark } from 'react-icons/io5'
import { useAuth } from '../../hooks/useAuth'

export default function LanguageSelection() {
  const nav = useNavigate()
  const { user } = useAuth()
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'ur'>(() => {
    return (localStorage.getItem('language') as 'en' | 'ur') || 'en'
  })

  const handleLanguageSelect = (lang: 'en' | 'ur') => {
    setSelectedLanguage(lang)
    localStorage.setItem('language', lang)
    // Could also set a context or state here to trigger language change
  }

  const handleContinue = () => {
    nav(user?.role === 'customer' ? '/customer/profile' : '/worker/profile')
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
      {/* Header */}
      <div className="bg-primary px-6 pt-10 pb-6 rounded-b-3xl shadow-md">
        <div className="flex items-center gap-4">
          <button onClick={() => nav(user?.role === 'customer' ? '/customer/profile' : '/worker/profile')}>
            <IoArrowBack size={24} className="text-white" />
          </button>
          <h1 className="text-white text-xl font-medium">Select Language</h1>
        </div>
      </div>

      <div className="flex-1 px-5 py-6">
        <p className="text-sm text-text-muted text-center mb-6">
          Choose your preferred language for the app
        </p>

        {/* Language Options */}
        <div className="space-y-4">
          {/* English */}
          <button
            onClick={() => handleLanguageSelect('en')}
            className={`w-full flex items-center justify-between p-5 rounded-xl border-2 transition ${
              selectedLanguage === 'en'
                ? 'border-primary bg-[#f0f9f0]'
                : 'border-border bg-white'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-2xl">
                🇬🇧
              </div>
              <div className="text-left">
                <p className="text-base font-medium text-text-primary">English</p>
                <p className="text-sm text-text-muted">Default Language</p>
              </div>
            </div>
            {selectedLanguage === 'en' && (
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <IoCheckmark size={20} className="text-white" />
              </div>
            )}
          </button>

          {/* Urdu */}
          <button
            onClick={() => handleLanguageSelect('ur')}
            className={`w-full flex items-center justify-between p-5 rounded-xl border-2 transition ${
              selectedLanguage === 'ur'
                ? 'border-primary bg-[#f0f9f0]'
                : 'border-border bg-white'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-2xl">
                🇵🇰
              </div>
              <div className="text-left">
                <p className="text-base font-medium text-text-primary">Urdu</p>
                <p className="text-sm text-text-muted">National Language</p>
              </div>
            </div>
            {selectedLanguage === 'ur' && (
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <IoCheckmark size={20} className="text-white" />
              </div>
            )}
          </button>
        </div>

        {/* Info Message */}
        <div className="mt-6 p-4 bg-[#e3f2fd] border border-[#90caf9] rounded-xl">
          <p className="text-sm text-[#1565c0]">
            Content will be automatically translated based on your selection
          </p>
        </div>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          className="w-full bg-primary text-white py-4 rounded-xl font-medium mt-8"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
