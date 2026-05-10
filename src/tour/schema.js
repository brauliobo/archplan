import { z } from 'zod'

const Vec2 = z.tuple([z.number(), z.number()])
const Vec3 = z.tuple([z.number(), z.number(), z.number()])

export const CameraShot = z.object({
  position: Vec3,
  lookAt: Vec3,
})

export const TourWaypoint = z.object({
  roomId: z.string(),
  dwell: z.number().nonnegative().default(2.5),
  narration: z.string().optional(),
  shot: CameraShot.optional(),
})

export const Tour = z.object({
  entry: z.object({
    doorId: z.string(),
    approach: Vec2.optional(),
  }),
  speed: z.number().positive().default(1.2),
  waypoints: z.array(TourWaypoint).min(1),
})
