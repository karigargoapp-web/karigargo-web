import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IoArrowBack, IoCamera, IoCalendar, IoTime, IoLocation,
  IoMic, IoStop, IoPlay, IoPause, IoTrash, IoVideocam,
} from 'react-icons/io5'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { SERVICE_CATEGORIES } from '../../types'
import LocationPicker from '../../components/LocationPicker'
import toast from 'react-hot-toast'

function formatDuration(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export default function PostJob() {
  const nav = useNavigate()
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [location, setLocation] = useState('')
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [budget, setBudget] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [video, setVideo] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState('')
  const [showMap, setShowMap] = useState(false)
  const [loading, setLoading] = useState(false)

  // Voice recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null)
  const [voicePreviewUrl, setVoicePreviewUrl] = useState('')
  const [isPlayingVoice, setIsPlayingVoice] = useState(false)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (voicePreviewUrl) URL.revokeObjectURL(voicePreviewUrl)
    }
  }, [voicePreviewUrl])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setVoiceBlob(blob)
        setVoicePreviewUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach(t => t.stop())
      }
      recorder.start()
      mediaRecorderRef.current = recorder
      setIsRecording(true)
      setRecordingDuration(0)
      timerRef.current = setInterval(() => setRecordingDuration(d => d + 1), 1000)
    } catch {
      toast.error('Microphone access denied')
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const togglePlayVoice = () => {
    if (!voicePreviewUrl) return
    if (!audioRef.current) {
      audioRef.current = new Audio(voicePreviewUrl)
      audioRef.current.onended = () => setIsPlayingVoice(false)
    }
    if (isPlayingVoice) {
      audioRef.current.pause()
      setIsPlayingVoice(false)
    } else {
      audioRef.current.play()
      setIsPlayingVoice(true)
    }
  }

  const deleteVoice = () => {
    audioRef.current?.pause()
    audioRef.current = null
    setVoiceBlob(null)
    setVoicePreviewUrl('')
    setIsPlayingVoice(false)
    setRecordingDuration(0)
  }

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) { setImage(f); setImagePreview(URL.createObjectURL(f)); setVideo(null); setVideoPreview('') }
  }

  const handleVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) { setVideo(f); setVideoPreview(URL.createObjectURL(f)); setImage(null); setImagePreview('') }
  }

  const handleLocationPick = useCallback((lat: number, lng: number, address: string) => {
    setLatitude(lat)
    setLongitude(lng)
    const shortened = address.split(',').slice(0, 4).join(',').trim()
    setLocation(shortened)
  }, [])

  const handleSubmit = async () => {
    if (!title || !description || !category || !location || !budget) {
      return toast.error('Please fill all required fields')
    }
    if (!user) return
    setLoading(true)

    try {
      let imageUrl = ''
      if (image) {
        const path = `jobs/${user.id}_${Date.now()}.jpg`
        await supabase.storage.from('job-images').upload(path, image)
        const { data } = supabase.storage.from('job-images').getPublicUrl(path)
        imageUrl = data.publicUrl
      } else if (video) {
        const path = `jobs/video_${user.id}_${Date.now()}.mp4`
        await supabase.storage.from('job-images').upload(path, video)
        const { data } = supabase.storage.from('job-images').getPublicUrl(path)
        imageUrl = data.publicUrl
      }

      let voiceNoteUrl = ''
      if (voiceBlob) {
        const voiceFile = new File([voiceBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' })
        const path = `voices/${user.id}_${Date.now()}.webm`
        await supabase.storage.from('job-images').upload(path, voiceFile)
        const { data } = supabase.storage.from('job-images').getPublicUrl(path)
        voiceNoteUrl = data.publicUrl
      }

      const { error } = await supabase.from('jobs').insert({
        title,
        description,
        category,
        location,
        latitude: latitude || null,
        longitude: longitude || null,
        budget: Number(budget),
        date: date || null,
        time: time || null,
        image_url: imageUrl || null,
        voice_note_url: voiceNoteUrl || null,
        status: 'pending',
        customer_id: user.id,
        customer_name: user.name,
        customer_photo: user.profile_photo_url || null,
      })

      if (error) return toast.error(error.message)
      toast.success('Job posted!')
      nav('/customer/home')
    } finally {
      setLoading(false)
    }
  }

  const hasMedia = !!(imagePreview || videoPreview)

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
      <div className="bg-primary px-6 pt-10 pb-5 rounded-b-3xl shadow-md">
        <div className="flex items-center gap-4">
          <button onClick={() => nav(-1)}><IoArrowBack size={24} className="text-white" /></button>
          <h1 className="text-white text-xl font-medium">Post a Task</h1>
        </div>
      </div>

      <div className="flex-1 px-5 py-5 space-y-4 overflow-y-auto pb-8">

        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-text-primary mb-1.5 block">Task Title *</label>
            <input placeholder="e.g. Fix leaking tap" value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          <div>
            <label className="text-sm font-medium text-text-primary mb-1.5 block">Category *</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className={!category ? 'text-text-muted' : ''}>
              <option value="">Select category</option>
              {SERVICE_CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.icon} {c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-text-primary mb-1.5 block">Description *</label>
            <textarea
              rows={3}
              placeholder="Describe the problem in detail..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="resize-none"
            />
          </div>
        </div>

        {/* Voice Note */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <label className="text-sm font-medium text-text-primary mb-3 block">Voice Note <span className="text-text-muted font-normal">(optional)</span></label>
          {voiceBlob ? (
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 border border-border">
              <button
                onClick={togglePlayVoice}
                className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0"
              >
                {isPlayingVoice
                  ? <IoPause size={18} className="text-white" />
                  : <IoPlay size={18} className="text-white ml-0.5" />}
              </button>
              <div className="flex-1">
                <div className="h-1.5 bg-primary/20 rounded-full">
                  <div className="h-1.5 bg-primary rounded-full" style={{ width: '40%' }} />
                </div>
                <p className="text-xs text-text-muted mt-1">{formatDuration(recordingDuration)}</p>
              </div>
              <button onClick={deleteVoice} className="p-2 text-red-400 hover:text-red-600 transition">
                <IoTrash size={18} />
              </button>
            </div>
          ) : isRecording ? (
            <div className="flex items-center gap-3 bg-red-50 rounded-xl p-3 border border-red-200">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse shrink-0" />
              <p className="flex-1 text-sm font-medium text-red-600">{formatDuration(recordingDuration)}</p>
              <button
                onClick={stopRecording}
                className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center"
              >
                <IoStop size={18} className="text-white" />
              </button>
            </div>
          ) : (
            <button
              onClick={startRecording}
              className="w-full flex items-center justify-center gap-2 border border-primary text-primary rounded-xl py-3 text-sm font-medium hover:bg-primary/5 transition"
            >
              <IoMic size={18} /> Record Voice Note
            </button>
          )}
        </div>

        {/* Photo / Video */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <label className="text-sm font-medium text-text-primary mb-3 block">
            Attachment <span className="text-text-muted font-normal">(optional)</span>
          </label>
          {hasMedia ? (
            <div className="relative rounded-xl overflow-hidden border border-border">
              {imagePreview && <img src={imagePreview} className="w-full h-44 object-cover" alt="preview" />}
              {videoPreview && (
                <video src={videoPreview} className="w-full h-44 object-cover" controls />
              )}
              <button
                onClick={() => { setImage(null); setImagePreview(''); setVideo(null); setVideoPreview('') }}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 flex items-center justify-center"
              >
                <span className="text-white text-xs font-bold">✕</span>
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <label className="flex-1 cursor-pointer">
                <div className="h-24 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1.5 hover:border-primary/40 hover:bg-primary/5 transition">
                  <IoCamera size={26} className="text-text-muted" />
                  <p className="text-xs text-text-muted font-medium">Photo</p>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
              </label>
              <label className="flex-1 cursor-pointer">
                <div className="h-24 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1.5 hover:border-primary/40 hover:bg-primary/5 transition">
                  <IoVideocam size={26} className="text-text-muted" />
                  <p className="text-xs text-text-muted font-medium">Video</p>
                </div>
                <input type="file" accept="video/*" className="hidden" onChange={handleVideo} />
              </label>
            </div>
          )}
        </div>

        {/* Location */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <label className="text-sm font-medium text-text-primary mb-1.5 block">Location *</label>
          <div className="relative">
            <IoLocation size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              placeholder="Enter area or address"
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="!pl-10"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowMap(v => !v)}
            className="mt-2 text-xs text-primary font-medium flex items-center gap-1"
          >
            📍 {showMap ? 'Hide map' : 'Pick on map (optional)'}
          </button>
          {showMap && (
            <div className="mt-3">
              <LocationPicker
                onSelect={handleLocationPick}
                initialPosition={latitude && longitude ? [latitude, longitude] : undefined}
              />
            </div>
          )}
        </div>

        {/* Budget + Date/Time */}
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-text-primary mb-1.5 block">Budget (PKR) *</label>
            <input type="number" placeholder="e.g. 2500" value={budget} onChange={e => setBudget(e.target.value)} />
            <p className="text-xs text-text-muted mt-1">Suggested: PKR 2,000 – 5,000</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-text-primary mb-1.5 flex items-center gap-1">
                <IoCalendar size={14} /> Date
              </label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-text-primary mb-1.5 flex items-center gap-1">
                <IoTime size={14} /> Time
              </label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} />
            </div>
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading} className="btn-primary">
          {loading ? 'Posting...' : 'Post Task'}
        </button>
      </div>
    </div>
  )
}
