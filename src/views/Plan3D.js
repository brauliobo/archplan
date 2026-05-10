import { createElement, Suspense, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useHouse } from '../HouseContext.js'
import { useT } from '../i18n/index.js'
import { wallLength, wallAngle, lerp } from '../util/geom.js'
import { FIXTURES } from '../catalog/fixtures.js'
import { floorFor, MATERIALS } from '../catalog/rooms.js'
import FurnitureModel from './FurnitureModel.js'

const MODEL_BASE = '/models/furniture/'
Object.values(FIXTURES).forEach((f) => { if (f.model) useGLTF.preload(MODEL_BASE + f.model) })

const Mat = ({ kind, physical }) =>
  createElement(physical ? 'meshPhysicalMaterial' : 'meshStandardMaterial', { ...MATERIALS[kind], transparent: MATERIALS[kind].opacity != null && MATERIALS[kind].opacity < 1 })

const wallPieces = (wall, height, openings) => {
  const L = wallLength(wall)
  const ops = openings
    .filter((o) => o.wallId === wall.id)
    .map((o) => {
      const sill = o.sillHeight ?? 0
      return { t0: Math.max(0, o.t - o.width / 2 / L), t1: Math.min(1, o.t + o.width / 2 / L), y0: sill, y1: sill + o.height }
    })
  const cuts = new Set([0, 1])
  ops.forEach((o) => { cuts.add(o.t0); cuts.add(o.t1) })
  const ts = [...cuts].sort((a, b) => a - b)
  const pieces = []
  for (let i = 0; i < ts.length - 1; i++) {
    const ta = ts[i], tb = ts[i + 1]
    if (tb - ta < 1e-6) continue
    const mid = (ta + tb) / 2
    const op = ops.find((o) => o.t0 <= mid + 1e-9 && mid <= o.t1 + 1e-9)
    const lenSeg = (tb - ta) * L
    const tCenter = (ta + tb) / 2
    if (!op) {
      pieces.push({ tCenter, lenSeg, y0: 0, y1: height })
    } else {
      if (op.y0 > 0.001) pieces.push({ tCenter, lenSeg, y0: 0, y1: op.y0 })
      if (op.y1 < height - 0.001) pieces.push({ tCenter, lenSeg, y0: op.y1, y1: height })
    }
  }
  return pieces
}

const isExternal = (wall) => wall.thickness >= 0.15

function WallSegments({ wall, height, openings }) {
  const ang = wallAngle(wall)
  const dx = Math.cos(ang), dy = Math.sin(ang)
  const ax = wall.a[0], ay = wall.a[1]
  const L = wallLength(wall)
  const pieces = useMemo(() => wallPieces(wall, height, openings), [wall, height, openings])
  const matKind = isExternal(wall) ? 'wallExterior' : 'wallInterior'
  return pug`
    group
      each p, idx in pieces
        - const cx = ax + dx * p.tCenter * L
        - const cy = ay + dy * p.tCenter * L
        - const yMid = (p.y0 + p.y1) / 2
        - const yH = p.y1 - p.y0
        mesh(key=idx position=[cx, yMid, -cy] rotation=[0, -ang, 0] castShadow receiveShadow)
          boxGeometry(args=[p.lenSeg, yH, wall.thickness])
          Mat(kind=matKind)
  `
}

function Floor({ room }) {
  const shape = useMemo(() => {
    const s = new THREE.Shape()
    const [x0, y0] = room.polygon[0]
    s.moveTo(x0, y0)
    for (let i = 1; i < room.polygon.length; i++) {
      const [x, y] = room.polygon[i]
      s.lineTo(x, y)
    }
    s.closePath()
    return s
  }, [room])
  return pug`
    mesh(rotation=[-Math.PI/2, 0, 0] position=[0, 0.01, 0] receiveShadow)
      shapeGeometry(args=[shape])
      meshStandardMaterial(color=floorFor(room.type) roughness=0.7)
  `
}

function Roof({ level, show }) {
  if (!show) return null
  const xs = level.walls.flatMap((w) => [w.a[0], w.b[0]])
  const ys = level.walls.flatMap((w) => [w.a[1], w.b[1]])
  const minX = Math.min(...xs), maxX = Math.max(...xs)
  const minY = Math.min(...ys), maxY = Math.max(...ys)
  const overhang = 0.4
  const w = maxX - minX + 2 * overhang
  const d = maxY - minY + 2 * overhang
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  const slabT = 0.2
  const slabY = level.height + slabT / 2
  const parH = 0.5, parT = 0.12
  const parY = level.height + slabT + parH / 2
  return pug`
    group
      mesh(position=[cx, slabY, -cy] castShadow receiveShadow)
        boxGeometry(args=[w, slabT, d])
        Mat(kind="slab")
      mesh(position=[cx, parY, -(cy - d/2 + parT/2)] castShadow)
        boxGeometry(args=[w, parH, parT])
        Mat(kind="parapet")
      mesh(position=[cx, parY, -(cy + d/2 - parT/2)] castShadow)
        boxGeometry(args=[w, parH, parT])
        Mat(kind="parapet")
      mesh(position=[cx - w/2 + parT/2, parY, -cy] castShadow)
        boxGeometry(args=[parT, parH, d])
        Mat(kind="parapet")
      mesh(position=[cx + w/2 - parT/2, parY, -cy] castShadow)
        boxGeometry(args=[parT, parH, d])
        Mat(kind="parapet")
  `
}

function CounterTop({ wall, opening }) {
  const ang = wallAngle(wall)
  const c2 = lerp(wall.a, wall.b, opening.t)
  const sill = opening.sillHeight ?? 0
  const w = opening.width
  const t = wall.thickness * 1.6
  const tt = 0.04
  return pug`
    mesh(position=[c2[0], sill + tt / 2, -c2[1]] rotation=[0, -ang, 0] castShadow receiveShadow)
      boxGeometry(args=[w, tt, t])
      Mat(kind="counterTop")
  `
}

function WindowMesh({ wall, opening }) {
  const ang = wallAngle(wall)
  const c2 = lerp(wall.a, wall.b, opening.t)
  const sill = opening.sillHeight ?? 0
  const yMid = sill + opening.height / 2
  const w = opening.width, h = opening.height
  const t = wall.thickness
  const fr = 0.05
  return pug`
    group(position=[c2[0], yMid, -c2[1]] rotation=[0, -ang, 0])
      mesh(position=[0, h / 2 - fr / 2, 0])
        boxGeometry(args=[w, fr, t * 0.9])
        Mat(kind="windowFrame")
      mesh(position=[0, -h / 2 + fr / 2, 0])
        boxGeometry(args=[w, fr, t * 0.9])
        Mat(kind="windowFrame")
      mesh(position=[-w / 2 + fr / 2, 0, 0])
        boxGeometry(args=[fr, h - 2 * fr, t * 0.9])
        Mat(kind="windowFrame")
      mesh(position=[w / 2 - fr / 2, 0, 0])
        boxGeometry(args=[fr, h - 2 * fr, t * 0.9])
        Mat(kind="windowFrame")
      mesh
        boxGeometry(args=[w - 2 * fr, h - 2 * fr, 0.02])
        Mat(kind="glass" physical=true)
  `
}

function SlidingDoorMesh({ wall, opening }) {
  const ang = wallAngle(wall)
  const c2 = lerp(wall.a, wall.b, opening.t)
  const yMid = opening.height / 2
  const w = opening.width, h = opening.height
  const t = wall.thickness
  const fr = 0.05
  const leafT = 0.04
  const sideSign = opening.swing === 'right' ? 1 : -1
  return pug`
    group(position=[c2[0], yMid, -c2[1]] rotation=[0, -ang, 0])
      mesh(position=[0, h / 2 - fr / 2, 0])
        boxGeometry(args=[w + fr * 2, fr, t * 1.05])
        Mat(kind="doorFrame")
      mesh(position=[sideSign * (w / 2 - w / 4), -fr / 2, t / 2 + leafT / 2 + 0.005])
        boxGeometry(args=[w / 2, h - fr, leafT])
        Mat(kind="doorLeafInt")
      mesh(position=[sideSign * (w / 2 - w / 4), -fr / 2, -(t / 2 + leafT / 2 + 0.005)])
        boxGeometry(args=[w / 2, h - fr, leafT])
        Mat(kind="doorLeafInt")
      mesh(position=[sideSign * (w / 2 - 0.15), -fr / 2 - 0.1, t / 2 + leafT + 0.02])
        sphereGeometry(args=[0.035, 12, 12])
        Mat(kind="doorHandle")
  `
}

function DoorMesh({ wall, opening }) {
  const ang = wallAngle(wall)
  const c2 = lerp(wall.a, wall.b, opening.t)
  const yMid = opening.height / 2
  const w = opening.width, h = opening.height
  const t = wall.thickness
  const fr = 0.06
  const leafW = w - 2 * fr
  const leafT = 0.045
  const swing = -Math.PI / 6
  const exterior = isExternal(wall)
  const isPivot = w >= 0.95 && exterior
  const leafKind = exterior ? 'doorLeafExt' : 'doorLeafInt'
  return pug`
    group(position=[c2[0], yMid, -c2[1]] rotation=[0, -ang, 0])
      mesh(position=[0, h / 2 - fr / 2, 0])
        boxGeometry(args=[w, fr, t * 0.95])
        Mat(kind="doorFrame")
      mesh(position=[-w / 2 + fr / 2, -fr / 2, 0])
        boxGeometry(args=[fr, h - fr, t * 0.95])
        Mat(kind="doorFrame")
      mesh(position=[w / 2 - fr / 2, -fr / 2, 0])
        boxGeometry(args=[fr, h - fr, t * 0.95])
        Mat(kind="doorFrame")
      group(position=[isPivot ? 0 : -(w / 2 - fr), 0, 0] rotation=[0, isPivot ? swing / 2 : swing, 0])
        mesh(position=[isPivot ? 0 : leafW / 2, -fr / 2, leafT / 2])
          boxGeometry(args=[leafW, h - fr, leafT])
          Mat(kind=leafKind)
        mesh(position=[isPivot ? leafW * 0.4 : leafW - 0.1, -fr / 2, leafT + 0.025])
          sphereGeometry(args=[0.04, 16, 16])
          Mat(kind="doorHandle")
  `
}

function FixtureMesh({ fixture, ceilingY }) {
  const def = FIXTURES[fixture.kind]
  if (!def) return null
  const [w, d, h] = def.size
  const baseY = fixture.kind === 'ceiling_lamp' ? ceilingY - h : 0
  const position = [fixture.pos[0], baseY, -fixture.pos[1]]
  const rotation = [0, -fixture.rot, 0]
  if (def.model) {
    return pug`
      FurnitureModel(url=MODEL_BASE + def.model size=def.size position=position rotation=rotation)
    `
  }
  return pug`
    mesh(position=[position[0], baseY + h / 2, position[2]] rotation=rotation castShadow)
      boxGeometry(args=[w, h, d])
      meshStandardMaterial(color=def.color roughness=0.6)
  `
}

function Ground({ level }) {
  const xs = level.walls.flatMap((w) => [w.a[0], w.b[0]])
  const ys = level.walls.flatMap((w) => [w.a[1], w.b[1]])
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2
  const w = Math.max(...xs) - Math.min(...xs)
  const d = Math.max(...ys) - Math.min(...ys)
  return pug`
    group
      mesh(rotation=[-Math.PI/2, 0, 0] position=[cx, -0.01, -cy] receiveShadow)
        planeGeometry(args=[60, 60])
        Mat(kind="groundOutside")
      mesh(rotation=[-Math.PI/2, 0, 0] position=[cx, 0, -cy] receiveShadow)
        planeGeometry(args=[w + 1, d + 1])
        Mat(kind="groundLot")
  `
}

function LevelGroup({ level, showRoof }) {
  const position = [0, level.elevation, 0]
  return pug`
    group(position=position)
      Ground(level=level)
      Roof(level=level show=showRoof)
      each room in level.rooms
        Floor(key=room.id room=room)
      each w in level.walls
        WallSegments(key=w.id wall=w height=level.height openings=level.openings)
      each o in level.openings
        - const wall = level.walls.find((x) => x.id === o.wallId)
        if wall && o.kind === 'window'
          WindowMesh(key=o.id wall=wall opening=o)
        if wall && o.kind === 'door'
          DoorMesh(key=o.id wall=wall opening=o)
        if wall && o.kind === 'sliding'
          SlidingDoorMesh(key=o.id wall=wall opening=o)
        if wall && o.kind === 'counter'
          CounterTop(key=o.id wall=wall opening=o)
      each f in level.fixtures
        FixtureMesh(key=f.id fixture=f ceilingY=level.height)
  `
}

export default function Plan3D() {
  const { house } = useHouse()
  const { t } = useT()
  const [showRoof, setShowRoof] = useState(false)
  if (!house) return pug`.empty= t('panes.empty')`

  const level = house.levels[0]
  const xs = level.walls.flatMap((w) => [w.a[0], w.b[0]])
  const ys = level.walls.flatMap((w) => [w.a[1], w.b[1]])
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2
  const camera = { position: [cx + 11, 9, -cy + 13], fov: 40 }
  const target = [cx, 1, -cy]
  const lightPos = [cx + 8, 18, -cy + 10]

  return pug`
    .plan3d__wrap
      label.plan3d__roof
        input(type="checkbox" checked=showRoof onChange=(e) => setShowRoof(e.target.checked))
        |  ${t('panes.show_roof')}
      Canvas.plan3d(camera=camera shadows)
        color(attach="background" args=[MATERIALS.sky])
        fog(attach="fog" args=[MATERIALS.sky, 30, 90])
        ambientLight(intensity=0.4)
        directionalLight(position=lightPos intensity=1.1 castShadow shadow-mapSize=[2048, 2048] shadow-camera-left=-20 shadow-camera-right=20 shadow-camera-top=20 shadow-camera-bottom=-20 shadow-camera-near=0.5 shadow-camera-far=80)
        Grid(args=[80, 80] cellColor="#aab" sectionColor="#778" infiniteGrid fadeDistance=60 cellSize=1 sectionSize=5)
        Suspense(fallback=null)
          each lvl in house.levels
            LevelGroup(key=lvl.id level=lvl showRoof=showRoof)
        OrbitControls(makeDefault target=target maxPolarAngle=Math.PI/2 - 0.05)
  `
}
