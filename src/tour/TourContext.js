import { createContext, createElement, useContext, useMemo, useRef, useState } from 'react'

const Ctx = createContext(null)

export const CAMERA_MODES = ['third', 'first', 'cinematic']

export function TourProvider({ children }) {
  const doorStateRef = useRef(new Map())
  const guideRef = useRef(null)
  const headRef = useRef(null)
  const [cameraMode, setCameraMode] = useState('third')
  const [running, setRunning] = useState(false)
  const [recording, setRecording] = useState(false)
  const recorderRef = useRef(null)
  const startFnRef = useRef(null)
  const stopFnRef = useRef(null)

  const value = useMemo(() => ({
    doorStateRef,
    guideRef,
    headRef,
    cameraMode,
    setCameraMode,
    running,
    setRunning,
    recording,
    setRecording,
    recorderRef,
    startFnRef,
    stopFnRef,
    start: () => startFnRef.current && startFnRef.current(),
    stop: () => stopFnRef.current && stopFnRef.current(),
  }), [cameraMode, running, recording])

  return createElement(Ctx.Provider, { value }, children)
}

export const useTour = () => {
  const v = useContext(Ctx)
  if (!v) throw new Error('useTour outside TourProvider')
  return v
}
