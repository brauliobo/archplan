import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'
import { useTour } from './TourContext.js'
import { model } from '../util/assets.js'

const URL = model('characters/Soldier.glb')
const TARGET_HEIGHT = 1.78
const HEAD_BONE_NAMES = ['mixamorig:Head', 'mixamorigHead', 'Head']
const WALK_THRESHOLD = 0.05

useGLTF.preload(URL)

const findAction = (actions, ...needles) => {
  for (const k of Object.keys(actions || {})) {
    const lc = k.toLowerCase()
    if (needles.some((n) => lc.includes(n))) return actions[k]
  }
  return null
}

export default function GuideCharacter() {
  const { guideRef, headRef } = useTour()
  const { scene, animations } = useGLTF(URL)
  const cloned = useMemo(() => scene.clone(true), [scene])
  const inner = useRef(null)

  const fit = useMemo(() => {
    const box = new THREE.Box3().setFromObject(cloned)
    const sz = new THREE.Vector3(); box.getSize(sz)
    const s = TARGET_HEIGHT / (sz.y || 1)
    cloned.traverse((o) => {
      if (o.isMesh) { o.castShadow = true; o.receiveShadow = true }
      o.userData.tourIgnore = true
    })
    return { scale: s, offsetY: -box.min.y * s }
  }, [cloned])

  const { actions } = useAnimations(animations, cloned)
  const idle = useMemo(() => findAction(actions, 'idle'), [actions])
  const walk = useMemo(() => findAction(actions, 'walk'), [actions])

  useEffect(() => {
    for (const name of HEAD_BONE_NAMES) {
      const node = cloned.getObjectByName(name)
      if (node) { headRef.current = node; break }
    }
    idle?.reset().setEffectiveWeight(1).play()
    walk?.reset().setEffectiveWeight(0).play()
  }, [cloned, idle, walk, headRef])

  const lastPos = useRef(new THREE.Vector3())
  const speedSmoothed = useRef(0)
  useFrame((_, dt) => {
    const g = guideRef.current
    if (!g) return
    const dx = g.position.x - lastPos.current.x
    const dz = g.position.z - lastPos.current.z
    const speed = dt > 0 ? Math.hypot(dx, dz) / dt : 0
    lastPos.current.copy(g.position)
    speedSmoothed.current += (speed - speedSmoothed.current) * Math.min(1, dt * 6)
    const moving = speedSmoothed.current > WALK_THRESHOLD
    if (idle && walk) {
      const target = moving ? 1 : 0
      walk.setEffectiveWeight(walk.getEffectiveWeight() + (target - walk.getEffectiveWeight()) * Math.min(1, dt * 5))
      idle.setEffectiveWeight(1 - walk.getEffectiveWeight())
      walk.timeScale = 1.1
    }
  })

  return pug`
    group(ref=guideRef position=[0, 0, 0])
      group(ref=inner position=[0, fit.offsetY, 0] scale=fit.scale rotation=[0, Math.PI, 0])
        primitive(object=cloned)
  `
}
