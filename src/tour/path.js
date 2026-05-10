import { polyCentroid, wallLength, wallAngle, lerp } from '../util/geom.js'

const APPROACH_DIST = 3
const DOOR_INSIDE_OFFSET = 0.55
const ROOM_INSET = 0.6

const doorWorldPos = (wall, opening) => lerp(wall.a, wall.b, opening.t)

const pointInPolygon = ([x, y], poly) => {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    if (((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)) inside = !inside
  }
  return inside
}

const PROBE = 0.25

const roomsAtOpening = (wall, opening, level) => {
  const c = doorWorldPos(wall, opening)
  const ang = wallAngle(wall)
  const nx = -Math.sin(ang), ny = Math.cos(ang)
  const sideA = [c[0] + nx * PROBE, c[1] + ny * PROBE]
  const sideB = [c[0] - nx * PROBE, c[1] - ny * PROBE]
  const a = level.rooms.find((r) => pointInPolygon(sideA, r.polygon))
  const b = level.rooms.find((r) => pointInPolygon(sideB, r.polygon))
  return [a, b].filter((r) => !!r)
}

const wallNormalToward = (wall, room, level) => {
  const ang = wallAngle(wall)
  const nx = -Math.sin(ang), ny = Math.cos(ang)
  const mid = lerp(wall.a, wall.b, 0.5)
  const probe = [mid[0] + nx * 0.15, mid[1] + ny * 0.15]
  const towardRoom = room && pointInPolygon(probe, room.polygon)
  return (towardRoom ? 1 : -1)
}

const wallNormalOutward = (wall, level) => {
  const ang = wallAngle(wall)
  const nx = -Math.sin(ang), ny = Math.cos(ang)
  const mid = lerp(wall.a, wall.b, 0.5)
  const probe = [mid[0] + nx * 0.15, mid[1] + ny * 0.15]
  const inside = level.rooms.some((r) => pointInPolygon(probe, r.polygon))
  return inside ? [-nx, -ny] : [nx, ny]
}

const buildRoomGraph = (level) => {
  const adj = new Map(level.rooms.map((r) => [r.id, []]))
  for (const o of level.openings) {
    if (o.kind !== 'door' && o.kind !== 'sliding') continue
    const wall = level.walls.find((w) => w.id === o.wallId)
    if (!wall) continue
    const rooms = roomsAtOpening(wall, o, level)
    if (rooms.length !== 2) continue
    const [a, b] = rooms
    if (a.id === b.id) continue
    adj.get(a.id).push({ to: b.id, opening: o, wall })
    adj.get(b.id).push({ to: a.id, opening: o, wall })
  }
  return adj
}

const bfs = (adj, fromId, toId) => {
  if (fromId === toId) return [fromId]
  const prev = new Map([[fromId, null]])
  const queue = [fromId]
  while (queue.length) {
    const cur = queue.shift()
    for (const e of adj.get(cur) || []) {
      if (prev.has(e.to)) continue
      prev.set(e.to, { from: cur, via: e })
      if (e.to === toId) {
        const path = []
        let node = toId
        while (node) {
          const p = prev.get(node)
          if (!p) { path.unshift({ roomId: node }); break }
          path.unshift({ roomId: node, viaOpening: p.via.opening, viaWall: p.via.wall })
          node = p.from
        }
        return path
      }
      queue.push(e.to)
    }
  }
  return null
}

const insetTowardCentroid = (point, room) => {
  const c = polyCentroid(room.polygon)
  const dx = c[0] - point[0], dy = c[1] - point[1]
  const len = Math.hypot(dx, dy)
  if (len < 1e-6) return point
  const k = Math.min(ROOM_INSET, len * 0.4)
  return [point[0] + (dx / len) * k, point[1] + (dy / len) * k]
}

const doorApproachPair = (wall, opening, fromRoom, toRoom) => {
  const center = doorWorldPos(wall, opening)
  const sign = wallNormalToward(wall, toRoom)
  const ang = wallAngle(wall)
  const nx = -Math.sin(ang), ny = Math.cos(ang)
  const before = [center[0] - nx * sign * DOOR_INSIDE_OFFSET, center[1] - ny * sign * DOOR_INSIDE_OFFSET]
  const after = [center[0] + nx * sign * DOOR_INSIDE_OFFSET, center[1] + ny * sign * DOOR_INSIDE_OFFSET]
  return { before, center, after }
}

export const buildTourPath = (level, tour) => {
  const out = []
  const entryDoor = level.openings.find((o) => o.id === tour.entry.doorId)
  if (!entryDoor) return out
  const entryWall = level.walls.find((w) => w.id === entryDoor.wallId)
  if (!entryWall) return out
  const adj = buildRoomGraph(level)

  const firstRoom = roomsAtOpening(entryWall, entryDoor, level)[0]
  const center = doorWorldPos(entryWall, entryDoor)
  const outward = wallNormalOutward(entryWall, level)
  const approach = tour.entry.approach || [center[0] + outward[0] * APPROACH_DIST, center[1] + outward[1] * APPROACH_DIST]
  const insideEntry = [center[0] - outward[0] * DOOR_INSIDE_OFFSET, center[1] - outward[1] * DOOR_INSIDE_OFFSET]

  out.push({ kind: 'outside', pos: approach })
  out.push({ kind: 'door', pos: center, doorId: entryDoor.id })
  out.push({ kind: 'enter', pos: insideEntry })

  let prevRoom = firstRoom
  tour.waypoints.forEach((wp, i) => {
    const target = level.rooms.find((r) => r.id === wp.roomId)
    if (!target) return
    if (prevRoom && prevRoom.id !== target.id) {
      const hops = bfs(adj, prevRoom.id, target.id)
      if (hops) {
        let cur = prevRoom
        for (let h = 1; h < hops.length; h++) {
          const step = hops[h]
          const nextRoom = level.rooms.find((r) => r.id === step.roomId)
          const ap = doorApproachPair(step.viaWall, step.viaOpening, cur, nextRoom)
          out.push({ kind: 'doorApproach', pos: ap.before })
          out.push({ kind: 'door', pos: ap.center, doorId: step.viaOpening.id })
          out.push({ kind: 'doorApproach', pos: ap.after })
          cur = nextRoom
        }
      } else {
        const c = polyCentroid(target.polygon)
        out.push({ kind: 'roomCenter', pos: c, roomId: target.id, dwell: wp.dwell ?? 2.5, narration: wp.narration, shot: wp.shot, index: i })
        prevRoom = target
        return
      }
    }
    const c = polyCentroid(target.polygon)
    out.push({ kind: 'roomCenter', pos: c, roomId: target.id, dwell: wp.dwell ?? 2.5, narration: wp.narration, shot: wp.shot, index: i })
    prevRoom = target
  })

  return out
}
