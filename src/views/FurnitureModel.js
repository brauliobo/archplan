import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

export default function FurnitureModel({ url, size, position, rotation }) {
  const { scene } = useGLTF(url)
  const cloned = useMemo(() => {
    const c = scene.clone(true)
    c.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true } })
    return c
  }, [scene])
  const fit = useMemo(() => {
    const box = new THREE.Box3().setFromObject(cloned)
    const sz = new THREE.Vector3(); box.getSize(sz)
    const sx = size[0] / (sz.x || 1)
    const sy = size[2] / (sz.y || 1)
    const sd = size[1] / (sz.z || 1)
    const cx = (box.min.x + box.max.x) / 2
    const cz = (box.min.z + box.max.z) / 2
    return { scale: [sx, sy, sd], offset: [-cx * sx, -box.min.y * sy, -cz * sd] }
  }, [cloned, size])
  return pug`
    group(position=position rotation=rotation)
      group(position=fit.offset scale=fit.scale)
        primitive(object=cloned)
  `
}
