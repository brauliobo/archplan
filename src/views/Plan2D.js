import { useMemo, useRef, useState } from 'react'
import { useHouse } from '../HouseContext.js'
import { useT } from '../i18n/index.js'
import { polyCentroid, wallAngle, lerp, bbox, polyArea, wallLength } from '../util/geom.js'
import { FIXTURE_SIZE, FIXTURE_COLOR } from '../catalog/fixtures.js'
import { fillFor } from '../catalog/rooms.js'

const toPts = (poly) => poly.map(([x, y]) => `${x},${-y}`).join(' ')

function RoomFill({ room }) {
  return pug`
    polygon(points=toPts(room.polygon) fill=fillFor(room.type) stroke="#9aa" strokeWidth=0.02)
  `
}

function RoomLabel({ room }) {
  const [cx, cy] = polyCentroid(room.polygon)
  const area = polyArea(room.polygon)
  const fontSize = Math.max(0.18, Math.min(0.36, Math.sqrt(area) * 0.13))
  return pug`
    g(pointerEvents="none")
      text(x=cx y=-cy fontSize=fontSize textAnchor="middle" dominantBaseline="middle" fill="#1a1a1a" fontWeight=600 paintOrder="stroke" stroke="#fff" strokeWidth=0.05 strokeLinejoin="round")= room.label
      text(x=cx y=-cy + fontSize * 0.95 fontSize=fontSize * 0.7 textAnchor="middle" dominantBaseline="middle" fill="#444" paintOrder="stroke" stroke="#fff" strokeWidth=0.04 strokeLinejoin="round")= area.toFixed(1) + ' m²'
  `
}

function WallLine({ wall }) {
  return pug`
    line(x1=wall.a[0] y1=-wall.a[1] x2=wall.b[0] y2=-wall.b[1] stroke="#1a1a1a" strokeWidth=wall.thickness strokeLinecap="square")
  `
}

function WallDimension({ wall, isExterior }) {
  const len = wallLength(wall)
  if (len < 0.5) return null
  const cx = (wall.a[0] + wall.b[0]) / 2
  const cyM = (wall.a[1] + wall.b[1]) / 2
  const cy = -cyM
  const dx = wall.b[0] - wall.a[0]
  const dyS = -(wall.b[1] - wall.a[1])
  const ang = Math.atan2(dyS, dx)
  let deg = ang * 180 / Math.PI
  if (deg > 90) deg -= 180
  if (deg < -90) deg += 180
  const offset = isExterior ? 0.45 : 0.16
  const nx = -Math.sin(ang) * offset, ny = Math.cos(ang) * offset
  const ax = wall.a[0], ay = -wall.a[1]
  const bx = wall.b[0], by = -wall.b[1]
  const tx = cx + nx, ty = cy + ny
  const transform = `rotate(${deg.toFixed(2)} ${tx} ${ty})`
  const txt = len.toFixed(2) + ' m'
  if (!isExterior) {
    return pug`
      g(pointerEvents="none")
        text(x=tx y=ty fontSize=0.14 textAnchor="middle" dominantBaseline="middle" fill="#666" transform=transform paintOrder="stroke" stroke="#fff" strokeWidth=0.05 strokeLinejoin="round")= txt
    `
  }
  const ex = -Math.sin(ang), ey = Math.cos(ang)
  const off1 = offset * 0.4, off2 = offset * 0.95
  const ex1a = ax + ex * off1, ey1a = ay + ey * off1
  const ex1b = ax + ex * off2, ey1b = ay + ey * off2
  const ex2a = bx + ex * off1, ey2a = by + ey * off1
  const ex2b = bx + ex * off2, ey2b = by + ey * off2
  const dlxa = ax + ex * (offset - 0.05), dlya = ay + ey * (offset - 0.05)
  const dlxb = bx + ex * (offset - 0.05), dlyb = by + ey * (offset - 0.05)
  return pug`
    g(pointerEvents="none")
      line(x1=ex1a y1=ey1a x2=ex1b y2=ey1b stroke="#888" strokeWidth=0.015)
      line(x1=ex2a y1=ey2a x2=ex2b y2=ey2b stroke="#888" strokeWidth=0.015)
      line(x1=dlxa y1=dlya x2=dlxb y2=dlyb stroke="#888" strokeWidth=0.015)
      text(x=tx y=ty fontSize=0.18 textAnchor="middle" dominantBaseline="middle" fill="#444" transform=transform paintOrder="stroke" stroke="#fff" strokeWidth=0.06 strokeLinejoin="round")= txt
  `
}

function OpeningMark({ opening, walls }) {
  const wall = walls.find((w) => w.id === opening.wallId)
  if (!wall) return null
  const a = [wall.a[0], -wall.a[1]]
  const b = [wall.b[0], -wall.b[1]]
  const c = lerp(a, b, opening.t)
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0])
  const ux = Math.cos(ang), uy = Math.sin(ang)
  const halfW = opening.width / 2
  const x1 = c[0] - ux * halfW, y1 = c[1] - uy * halfW
  const x2 = c[0] + ux * halfW, y2 = c[1] + uy * halfW

  if (opening.kind === 'door') {
    const nx = -uy, ny = ux
    const w = opening.width
    const lx = x1 + nx * w, ly = y1 + ny * w
    const lt = 0.05
    const leafPath = `M ${x1} ${y1} L ${lx} ${ly} L ${lx + ux * lt} ${ly + uy * lt} L ${x1 + ux * lt} ${y1 + uy * lt} z`
    const arcPath = `M ${lx} ${ly} A ${w} ${w} 0 0 1 ${x2} ${y2}`
    return pug`
      g
        line(x1=x1 y1=y1 x2=x2 y2=y2 stroke="#fff" strokeWidth=wall.thickness + 0.04)
        path(d=arcPath fill="none" stroke="#1a1a1a" strokeWidth=0.02)
        path(d=leafPath fill="#1a1a1a" stroke="#1a1a1a" strokeWidth=0.01 strokeLinejoin="miter")
    `
  }
  if (opening.kind === 'sliding') {
    const sideSign = opening.swing === 'right' ? 1 : -1
    const lx1 = c[0] + ux * (sideSign * 0) - ux * (opening.width / 2)
    const ly1 = c[1] + uy * (sideSign * 0) - uy * (opening.width / 2)
    const lx2 = c[0] + ux * (sideSign * 0) + ux * (opening.width / 2)
    const ly2 = c[1] + uy * (sideSign * 0) + uy * (opening.width / 2)
    const nx = -uy, ny = ux
    const off = wall.thickness / 2 + 0.025
    return pug`
      g
        line(x1=x1 y1=y1 x2=x2 y2=y2 stroke="#fff" strokeWidth=wall.thickness + 0.04)
        line(x1=lx1 + nx * off y1=ly1 + ny * off x2=lx2 + nx * off y2=ly2 + ny * off stroke="#1a1a1a" strokeWidth=0.04)
        line(x1=lx1 - nx * off y1=ly1 - ny * off x2=lx2 - nx * off y2=ly2 - ny * off stroke="#1a1a1a" strokeWidth=0.04)
    `
  }
  if (opening.kind === 'counter') {
    const nx = -uy, ny = ux
    const tk = wall.thickness * 0.6
    const cx0 = x1 - nx * tk / 2, cy0 = y1 - ny * tk / 2
    const dx = x2 - x1, dy = y2 - y1
    const dPath = `M ${cx0} ${cy0} l ${dx} ${dy} l ${nx * tk} ${ny * tk} l ${-dx} ${-dy} z`
    return pug`
      g
        line(x1=x1 y1=y1 x2=x2 y2=y2 stroke="#fff" strokeWidth=wall.thickness + 0.02)
        path(d=dPath fill="#9a7b5a" stroke="#5a4a30" strokeWidth=0.02)
    `
  }
  return pug`
    g
      line(x1=x1 y1=y1 x2=x2 y2=y2 stroke="#fff" strokeWidth=wall.thickness + 0.02)
      line(x1=x1 y1=y1 x2=x2 y2=y2 stroke="#27c" strokeWidth=0.08)
  `
}

function FixtureMark({ fixture }) {
  const size = FIXTURE_SIZE[fixture.kind]
  if (!size) return null
  const [w, d] = size
  const [x, y] = fixture.pos
  const transform = `translate(${x} ${-y}) rotate(${(fixture.rot || 0) * 180 / Math.PI})`
  return pug`
    g(transform=transform)
      rect(x=-w / 2 y=-d / 2 width=w height=d fill=FIXTURE_COLOR[fixture.kind] stroke="#444" strokeWidth=0.02 opacity=0.9)
  `
}

export default function Plan2D() {
  const { house } = useHouse()
  const { t } = useT()
  if (!house) return pug`.empty= t('panes.empty')`

  const level = house.levels[0]
  const houseBbox = useMemo(() => bbox(level.walls.flatMap((w) => [w.a, w.b])), [level])
  const isExterior = (w) => {
    const onPerim = (p) => Math.abs(p[0] - houseBbox.minX) < 1e-3 || Math.abs(p[0] - houseBbox.maxX) < 1e-3
                         || Math.abs(p[1] - houseBbox.minY) < 1e-3 || Math.abs(p[1] - houseBbox.maxY) < 1e-3
    if (!onPerim(w.a) || !onPerim(w.b)) return false
    if (Math.abs(w.a[0] - w.b[0]) < 1e-3) return Math.abs(w.a[0] - houseBbox.minX) < 1e-3 || Math.abs(w.a[0] - houseBbox.maxX) < 1e-3
    if (Math.abs(w.a[1] - w.b[1]) < 1e-3) return Math.abs(w.a[1] - houseBbox.minY) < 1e-3 || Math.abs(w.a[1] - houseBbox.maxY) < 1e-3
    return false
  }
  const initial = useMemo(() => {
    const pad = 1.4
    return `${houseBbox.minX - pad} ${-houseBbox.maxY - pad} ${houseBbox.w + pad * 2} ${houseBbox.h + pad * 2}`
  }, [houseBbox])
  const [vb, setVb] = useState(initial)
  const dragRef = useRef(null)

  const onWheel = (e) => {
    e.preventDefault()
    const [x, y, w, h] = vb.split(' ').map(Number)
    const k = e.deltaY > 0 ? 1.1 : 1 / 1.1
    const cx = x + w / 2, cy = y + h / 2
    const nw = w * k, nh = h * k
    setVb(`${cx - nw / 2} ${cy - nh / 2} ${nw} ${nh}`)
  }
  const onMouseDown = (e) => { dragRef.current = { x: e.clientX, y: e.clientY, vb } }
  const onMouseMove = (e) => {
    if (!dragRef.current) return
    const [x, y, w, h] = dragRef.current.vb.split(' ').map(Number)
    const r = e.currentTarget.getBoundingClientRect()
    const dx = (e.clientX - dragRef.current.x) * (w / r.width)
    const dy = (e.clientY - dragRef.current.y) * (h / r.height)
    setVb(`${x - dx} ${y - dy} ${w} ${h}`)
  }
  const onMouseUp = () => { dragRef.current = null }

  return pug`
    svg.plan2d(viewBox=vb onWheel=onWheel onMouseDown=onMouseDown onMouseMove=onMouseMove onMouseUp=onMouseUp onMouseLeave=onMouseUp)
      g
        each room in level.rooms
          RoomFill(key=room.id room=room)
        each f in level.fixtures
          FixtureMark(key=f.id fixture=f)
        each w in level.walls
          WallLine(key=w.id wall=w)
        each o in level.openings
          OpeningMark(key=o.id opening=o walls=level.walls)
        each room in level.rooms
          RoomLabel(key='l-' + room.id room=room)
  `
}
