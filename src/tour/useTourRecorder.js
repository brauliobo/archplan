import { useCallback, useRef, useState } from 'react'

const CODECS = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']

const pickCodec = () => {
  if (typeof MediaRecorder === 'undefined') return null
  return CODECS.find((c) => MediaRecorder.isTypeSupported(c)) || null
}

export const recorderSupported = () => pickCodec() != null

export default function useTourRecorder() {
  const recRef = useRef(null)
  const chunksRef = useRef([])
  const [recording, setRecording] = useState(false)

  const start = useCallback(() => {
    const canvas = document.querySelector('.plan3d canvas') || document.querySelector('canvas')
    const codec = pickCodec()
    if (!canvas || !codec) return false
    const stream = canvas.captureStream(60)
    const rec = new MediaRecorder(stream, { mimeType: codec, videoBitsPerSecond: 8_000_000 })
    chunksRef.current = []
    rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tour-${new Date().toISOString().replace(/[:.]/g, '-')}.webm`
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    }
    rec.start(250)
    recRef.current = rec
    setRecording(true)
    return true
  }, [])

  const stop = useCallback(() => {
    const rec = recRef.current
    if (rec && rec.state !== 'inactive') rec.stop()
    recRef.current = null
    setRecording(false)
  }, [])

  return { recording, start, stop }
}
