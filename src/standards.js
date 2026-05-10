import { polyArea, bbox, wallLength } from './util/geom.js'

const MIN_AREA = {
  bedroom: 9, suite: 9, kitchen: 6, living: 10, dining: 6,
  bathroom: 2.4, laundry: 2, hall: 1, closet: 1.5, garage: 12, office: 6,
}

const MIN_DOOR_WIDTH = { bathroom: 0.70, default: 0.80 }
const MIN_HALL_WIDTH = 0.90
const MIN_CEILING = 2.50

const sub = (a, b) => [a[0] - b[0], a[1] - b[1]]
const dot = (a, b) => a[0] * b[0] + a[1] * b[1]
const cross = (a, b) => a[0] * b[1] - a[1] * b[0]
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1])

const pointOnSegment = (p, a, b, eps = 1e-3) => {
  const ab = sub(b, a), ap = sub(p, a)
  const ablen2 = dot(ab, ab)
  if (ablen2 < 1e-9) return null
  const t = dot(ap, ab) / ablen2
  if (t < -eps || t > 1 + eps) return null
  const c = cross(ab, ap)
  if (Math.abs(c) / Math.sqrt(ablen2) > eps) return null
  return Math.max(0, Math.min(1, t))
}

const segmentsIntersect = (a1, a2, b1, b2) => {
  const d1 = cross(sub(b2, b1), sub(a1, b1))
  const d2 = cross(sub(b2, b1), sub(a2, b1))
  const d3 = cross(sub(a2, a1), sub(b1, a1))
  const d4 = cross(sub(a2, a1), sub(b2, a1))
  return d1 * d2 < 0 && d3 * d4 < 0
}

const polygonSelfIntersects = (poly) => {
  const n = poly.length
  for (let i = 0; i < n; i++) {
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue
      if (segmentsIntersect(poly[i], poly[(i + 1) % n], poly[j], poly[(j + 1) % n])) return true
    }
  }
  return false
}

const checkAreas = (level) => level.rooms.flatMap((r) => {
  const a = polyArea(r.polygon)
  const min = MIN_AREA[r.type]
  if (!min || a + 1e-6 >= min) return []
  return [{ code: 'NBR15575/area', tKey: 'issues.area',
    params: { label: r.label, type: r.type, value: a.toFixed(2), min },
    ref: { level: level.id, room: r.id } }]
})

const checkDoors = (level) => level.openings.flatMap((o) => {
  if (o.kind !== 'door' || o.width + 1e-6 >= MIN_DOOR_WIDTH.bathroom) return []
  return [{ code: 'NBR9050/door', tKey: 'issues.door',
    params: { id: o.id, value: o.width.toFixed(2), min: MIN_DOOR_WIDTH.default },
    ref: { level: level.id, opening: o.id } }]
})

const checkHalls = (level) => level.rooms.flatMap((r) => {
  if (r.type !== 'hall') return []
  const b = bbox(r.polygon)
  const narrow = Math.min(b.w, b.h)
  if (narrow + 1e-6 >= MIN_HALL_WIDTH) return []
  return [{ code: 'NBR9050/hall', tKey: 'issues.hall',
    params: { label: r.label, value: narrow.toFixed(2), min: MIN_HALL_WIDTH },
    ref: { level: level.id, room: r.id } }]
})

const checkOpeningRange = (level) => level.openings.flatMap((o) => {
  const wall = level.walls.find((w) => w.id === o.wallId)
  if (!wall) return [{ code: 'GEOM/opening-orphan', tKey: 'issues.opening_orphan',
    params: { id: o.id, wallId: o.wallId }, ref: { level: level.id, opening: o.id } }]
  const L = wallLength(wall)
  const half = o.width / 2 / L
  if (o.t - half < -1e-6 || o.t + half > 1 + 1e-6) return [{ code: 'GEOM/opening-overflow',
    tKey: 'issues.opening_overflow', params: { id: o.id }, ref: { level: level.id, opening: o.id } }]
  return []
})

const checkOpeningOverlap = (level) => {
  const issues = []
  const byWall = new Map()
  for (const o of level.openings) {
    const arr = byWall.get(o.wallId) || []
    arr.push(o)
    byWall.set(o.wallId, arr)
  }
  for (const [wallId, ops] of byWall) {
    const wall = level.walls.find((w) => w.id === wallId)
    if (!wall) continue
    const L = wallLength(wall)
    for (let i = 0; i < ops.length; i++) {
      for (let j = i + 1; j < ops.length; j++) {
        const a = ops[i], b = ops[j]
        const ah = a.width / 2 / L, bh = b.width / 2 / L
        if (Math.abs(a.t - b.t) < ah + bh - 1e-6) issues.push({
          code: 'GEOM/opening-overlap', tKey: 'issues.opening_overlap',
          params: { a: a.id, b: b.id }, ref: { level: level.id, opening: a.id } })
      }
    }
  }
  return issues
}

const checkWallEndpointsOnOpenings = (level) => {
  const issues = []
  for (const wall of level.walls) {
    for (const endpoint of [wall.a, wall.b]) {
      for (const other of level.walls) {
        if (other.id === wall.id) continue
        const t = pointOnSegment(endpoint, other.a, other.b)
        if (t == null || t < 0.005 || t > 0.995) continue
        const L = wallLength(other)
        for (const op of level.openings) {
          if (op.wallId !== other.id) continue
          const half = op.width / 2 / L
          if (Math.abs(op.t - t) < half - 1e-6) issues.push({
            code: 'GEOM/wall-pierces-opening', tKey: 'issues.wall_pierces_opening',
            params: { wall: wall.id, opening: op.id, host: other.id },
            ref: { level: level.id, opening: op.id } })
        }
      }
    }
  }
  return issues
}

const checkSelfIntersect = (level) => level.rooms.flatMap((r) => {
  if (!polygonSelfIntersects(r.polygon)) return []
  return [{ code: 'GEOM/polygon-self-intersect', tKey: 'issues.polygon_self_intersect',
    params: { label: r.label }, ref: { level: level.id, room: r.id } }]
})

const checkRoomsOverlap = (level) => {
  const issues = []
  const rooms = level.rooms
  for (let i = 0; i < rooms.length; i++) {
    for (let j = i + 1; j < rooms.length; j++) {
      const a = rooms[i], b = rooms[j]
      const ba = bbox(a.polygon), bb = bbox(b.polygon)
      if (ba.maxX <= bb.minX + 1e-6 || bb.maxX <= ba.minX + 1e-6) continue
      if (ba.maxY <= bb.minY + 1e-6 || bb.maxY <= ba.minY + 1e-6) continue
      const aMid = [(ba.minX + ba.maxX) / 2, (ba.minY + ba.maxY) / 2]
      const bMid = [(bb.minX + bb.maxX) / 2, (bb.minY + bb.maxY) / 2]
      if (pointInPolygon(aMid, b.polygon) || pointInPolygon(bMid, a.polygon)) issues.push({
        code: 'GEOM/rooms-overlap', tKey: 'issues.rooms_overlap',
        params: { a: a.label, b: b.label }, ref: { level: level.id, room: a.id } })
    }
  }
  return issues
}

const pointInPolygon = (p, poly) => {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j]
    if (((yi > p[1]) !== (yj > p[1])) && (p[0] < (xj - xi) * (p[1] - yi) / (yj - yi) + xi)) inside = !inside
  }
  return inside
}

const checkBedroomsHaveExteriorWindow = (level) => {
  const xs = level.walls.flatMap((w) => [w.a[0], w.b[0]])
  const ys = level.walls.flatMap((w) => [w.a[1], w.b[1]])
  const minX = Math.min(...xs), maxX = Math.max(...xs)
  const minY = Math.min(...ys), maxY = Math.max(...ys)
  const onPerimeter = (a, b) => {
    const onMinX = Math.abs(a[0] - minX) < 1e-3 && Math.abs(b[0] - minX) < 1e-3
    const onMaxX = Math.abs(a[0] - maxX) < 1e-3 && Math.abs(b[0] - maxX) < 1e-3
    const onMinY = Math.abs(a[1] - minY) < 1e-3 && Math.abs(b[1] - minY) < 1e-3
    const onMaxY = Math.abs(a[1] - maxY) < 1e-3 && Math.abs(b[1] - maxY) < 1e-3
    return onMinX || onMaxX || onMinY || onMaxY
  }
  const exteriorWalls = new Set(level.walls.filter((w) => onPerimeter(w.a, w.b)).map((w) => w.id))
  return level.rooms.flatMap((r) => {
    if (r.type !== 'bedroom' && r.type !== 'suite') return []
    const hasWindow = level.openings.some((o) => {
      if (o.kind !== 'window' || !exteriorWalls.has(o.wallId)) return false
      const wall = level.walls.find((w) => w.id === o.wallId)
      const L = wallLength(wall)
      const center = [wall.a[0] + (wall.b[0] - wall.a[0]) * o.t, wall.a[1] + (wall.b[1] - wall.a[1]) * o.t]
      const inward = [
        center[0] + (-(wall.b[1] - wall.a[1]) / L) * 0.3,
        center[1] + ((wall.b[0] - wall.a[0]) / L) * 0.3,
      ]
      const inwardOpp = [
        center[0] - (-(wall.b[1] - wall.a[1]) / L) * 0.3,
        center[1] - ((wall.b[0] - wall.a[0]) / L) * 0.3,
      ]
      return pointInPolygon(inward, r.polygon) || pointInPolygon(inwardOpp, r.polygon)
    })
    if (hasWindow) return []
    return [{ code: 'NBR15575/no-window', tKey: 'issues.no_window',
      params: { label: r.label }, ref: { level: level.id, room: r.id } }]
  })
}

export const checkHouse = (house) => {
  const issues = []
  for (const level of house.levels) {
    if (level.height + 1e-6 < MIN_CEILING) issues.push({
      code: 'NBR15575/ceiling', tKey: 'issues.ceiling',
      params: { value: level.height.toFixed(2), min: MIN_CEILING },
      ref: { level: level.id } })
    issues.push(...checkAreas(level))
    issues.push(...checkDoors(level))
    issues.push(...checkHalls(level))
    issues.push(...checkOpeningRange(level))
    issues.push(...checkOpeningOverlap(level))
    issues.push(...checkWallEndpointsOnOpenings(level))
    issues.push(...checkSelfIntersect(level))
    issues.push(...checkRoomsOverlap(level))
    issues.push(...checkBedroomsHaveExteriorWindow(level))
  }
  return issues
}

export const STANDARDS_SUMMARY = `Standards (NBR 15575 / NBR 9050):
- Min room areas (m²): bedroom 9, suite 9, kitchen 6, living 10, dining 6, bathroom 2.4, laundry 2, closet 1.5, garage 12.
- Min door width: 0.80 m (general), 0.70 m (bathroom).
- Min hallway width: 0.90 m.
- Min ceiling height: 2.50 m.
- Windows: min area 1/8 of the room's floor area.
- A bedroom must not open directly off the kitchen.`
