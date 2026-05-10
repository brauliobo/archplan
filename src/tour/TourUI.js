import { useEffect } from 'react'
import { useT } from '../i18n/index.js'
import { useTour, CAMERA_MODES } from './TourContext.js'
import useTourRecorder, { recorderSupported } from './useTourRecorder.js'

export default function TourUI({ house }) {
  const { t } = useT()
  const { running, start, stop, cameraMode, setCameraMode } = useTour()
  const { recording, start: recStart, stop: recStop } = useTourRecorder()
  const hasTour = !!house?.tour
  const canRecord = recorderSupported()

  useEffect(() => () => { if (recording) recStop() }, [])

  const onStart = () => {
    if (recording) { /* already recording, restart anyway */ }
    start()
  }

  const onRecord = () => {
    if (recording) { recStop(); return }
    if (!canRecord) return
    recStart()
  }

  return pug`
    .tour-ui
      .tour-ui__row
        button(disabled=!hasTour onClick=running ? stop : onStart)
          = running ? t('tour.stop') : t('tour.start')
        button(disabled=!canRecord onClick=onRecord className=recording ? 'rec' : '')
          = recording ? t('tour.stop_record') : t('tour.record')
      .tour-ui__row
        each m in CAMERA_MODES
          button(key=m onClick=() => setCameraMode(m) className=cameraMode === m ? 'active' : '')
            = t('tour.mode_' + m)
      if !hasTour
        .tour-ui__hint= t('tour.no_tour')
      if !canRecord
        .tour-ui__hint= t('tour.recording_unsupported')
  `
}
