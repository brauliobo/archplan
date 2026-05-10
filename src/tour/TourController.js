import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { buildTourPath } from './path.js'
import { thirdPersonPose, firstPersonPose, cinematicPose, defaultCinematicForRoom } from './cameras.js'
import { dampVec3, damp } from '../util/tween.js'
import { useTour } from './TourContext.js'
import { useHouse } from '../HouseContext.js'


const DOOR_OPEN_RADIUS = 1.6
const DOOR_CLOSE_RADIUS = 2.6
const ARRIVE_EPS = 0.06
const CAM_LAMBDA = 4.0
const ROT_LAMBDA = 6.0
const DOOR_LAMBDA = 3.5

const shortestAngle = (from, to) => {
  let d = to - from
  while (d > Math.PI) d -= Math.PI * 2
  while (d < -Math.PI) d += Math.PI * 2
  return from + d
}

const updateDoors = (polyline, guide, doorMap, dt) => {
  const gx = guide.position.x, gz = guide.position.z
  const ids = new Set()
  for (const p of polyline) {
    if (!p.doorId) continue
    ids.add(p.doorId)
    const d = Math.hypot(p.pos[0] - gx, -p.pos[1] - gz)
    const cur = doorMap.get(p.doorId) ?? 0
    const target = d < DOOR_OPEN_RADIUS ? 1 : d > DOOR_CLOSE_RADIUS ? 0 : cur
    doorMap.set(p.doorId, cur + (target - cur) * (1 - Math.exp(-DOOR_LAMBDA * dt)))
  }
}

const computeDesired = (mode, guide, polyline, lastIdx, out) => {
  if (mode === 'first') return firstPersonPose(guide, out)
  if (mode === 'cinematic') {
    const wp = lastIdx >= 0 ? polyline[lastIdx] : null
    if (wp?.shot) return cinematicPose(wp.shot, out)
    if (wp) return defaultCinematicForRoom(wp.pos, out)
    return thirdPersonPose(guide, out)
  }
  return thirdPersonPose(guide, out)
}

export default function TourController({ level }) {
  const { camera } = useThree()
  const { house } = useHouse()
  const tour = house?.tour
  const { guideRef, doorStateRef, cameraMode, running, setRunning, startFnRef, stopFnRef } = useTour()
  const polyline = useMemo(() => tour ? buildTourPath(level, tour) : [], [level, tour])

  const stateRef = useRef({ idx: 0, dwellLeft: 0, finished: true, speed: 1.2 })
  const camPos = useRef(new THREE.Vector3())
  const camTarget = useRef(new THREE.Vector3())
  const desired = useRef({ position: new THREE.Vector3(), lookAt: new THREE.Vector3() })
  const lastShotIdx = useRef(-1)
  const yawRef = useRef(0)

  useEffect(() => {
    startFnRef.current = () => {
      if (!polyline.length || !guideRef.current) return
      const start = polyline[0].pos
      guideRef.current.position.set(start[0], 0, -start[1])
      const next = polyline[1]?.pos ?? start
      const yaw = Math.atan2(next[0] - start[0], -(next[1] - start[1]))
      guideRef.current.rotation.y = yaw
      yawRef.current = yaw
      stateRef.current = { idx: 1, dwellLeft: 0, finished: false, speed: tour?.speed ?? 1.2 }
      lastShotIdx.current = -1
      doorStateRef.current.clear()
      camPos.current.copy(camera.position)
      camTarget.current.set(start[0], 1, -start[1])
      setRunning(true)
    }
    stopFnRef.current = () => {
      stateRef.current.finished = true
      setRunning(false)
    }
  }, [polyline, tour, guideRef, doorStateRef, camera, setRunning, startFnRef, stopFnRef])

  useFrame((_, dt) => {
    if (!polyline.length) return
    const guide = guideRef.current
    if (!guide) return
    const st = stateRef.current
    const moving = !st.finished && st.dwellLeft <= 0
    if (typeof window !== 'undefined') window.__tour = { idx: st.idx, total: polyline.length, dwell: st.dwellLeft, finished: st.finished }

    if (moving && st.idx < polyline.length) {
      const target = polyline[st.idx]
      const dx = target.pos[0] - guide.position.x
      const dz = -target.pos[1] - guide.position.z
      const dist = Math.hypot(dx, dz)
      if (dist < ARRIVE_EPS) {
        if (target.kind === 'roomCenter') {
          st.dwellLeft = target.dwell ?? 2
          lastShotIdx.current = st.idx
        }
        st.idx++
        if (st.idx >= polyline.length) { st.finished = true; setRunning(false) }
      } else {
        const step = Math.min(dist, st.speed * dt)
        guide.position.x += (dx / dist) * step
        guide.position.z += (dz / dist) * step
        const desiredYaw = Math.atan2(dx, dz)
        yawRef.current = damp(yawRef.current, shortestAngle(yawRef.current, desiredYaw), ROT_LAMBDA, dt)
        guide.rotation.y = yawRef.current
      }
    } else if (st.dwellLeft > 0) {
      st.dwellLeft -= dt
    }

    updateDoors(polyline, guide, doorStateRef.current, dt)

    guide.visible = cameraMode !== 'first'
    if (running) {
      computeDesired(cameraMode, guide, polyline, lastShotIdx.current, desired.current)
      dampVec3(camPos.current, desired.current.position, CAM_LAMBDA, dt)
      dampVec3(camTarget.current, desired.current.lookAt, CAM_LAMBDA, dt)
      camera.position.copy(camPos.current)
      camera.lookAt(camTarget.current)
    }
  })

  return null
}
