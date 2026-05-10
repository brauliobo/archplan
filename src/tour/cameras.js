import * as THREE from 'three'

const _v = new THREE.Vector3()
const _f = new THREE.Vector3()

const guideHead = (guide) => _v.set(guide.position.x, 1.55, guide.position.z)
const guideForward = (guide) => _f.set(Math.sin(guide.rotation.y), 0, Math.cos(guide.rotation.y))

export const thirdPersonPose = (guide, out) => {
  const f = guideForward(guide)
  const head = guideHead(guide)
  out.position.set(head.x - f.x * 2.2, head.y + 1.4, head.z - f.z * 2.2)
  out.lookAt.set(head.x + f.x * 0.5, head.y - 0.7, head.z + f.z * 0.5)
}

export const firstPersonPose = (guide, out) => {
  const f = guideForward(guide)
  const head = guideHead(guide)
  out.position.set(head.x + f.x * 0.05, head.y + 0.05, head.z + f.z * 0.05)
  out.lookAt.set(head.x + f.x * 3.5, head.y - 0.05, head.z + f.z * 3.5)
}

const yFor = (sceneY) => sceneY

export const cinematicPose = (shot, out) => {
  const [px, py, pz] = shot.position
  const [lx, ly, lz] = shot.lookAt
  out.position.set(px, py, pz)
  out.lookAt.set(lx, ly, lz)
}

export const defaultCinematicForRoom = (centroid2d, out) => {
  const [x, y] = centroid2d
  out.position.set(x, 4.5, -y)
  out.lookAt.set(x + 0.01, 0.5, -y + 0.01)
}
