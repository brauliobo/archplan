export const polyArea = (poly) => {
  let s = 0
  for (let i = 0, n = poly.length; i < n; i++) {
    const [x1, y1] = poly[i]
    const [x2, y2] = poly[(i + 1) % n]
    s += x1 * y2 - x2 * y1
  }
  return Math.abs(s) / 2
}

export const polyCentroid = (poly) => {
  let cx = 0, cy = 0, a = 0
  for (let i = 0, n = poly.length; i < n; i++) {
    const [x1, y1] = poly[i]
    const [x2, y2] = poly[(i + 1) % n]
    const cross = x1 * y2 - x2 * y1
    cx += (x1 + x2) * cross
    cy += (y1 + y2) * cross
    a += cross
  }
  a /= 2
  return [cx / (6 * a), cy / (6 * a)]
}

export const wallLength = (w) => Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1])

export const wallAngle = (w) => Math.atan2(w.b[1] - w.a[1], w.b[0] - w.a[0])

export const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]

export const bbox = (points) => {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const [x, y] of points) {
    if (x < minX) minX = x
    if (y < minY) minY = y
    if (x > maxX) maxX = x
    if (y > maxY) maxY = y
  }
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY }
}
