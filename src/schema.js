import { z } from 'zod'

export const Vec2 = z.tuple([z.number(), z.number()])

export const Wall = z.object({
  id: z.string(),
  a: Vec2,
  b: Vec2,
  thickness: z.number().positive().default(0.15),
})

export const Opening = z.object({
  id: z.string(),
  wallId: z.string(),
  kind: z.enum(['door', 'window', 'counter']),
  t: z.number().min(0).max(1),
  width: z.number().positive(),
  height: z.number().positive(),
  sillHeight: z.number().min(0).default(0),
})

export const ROOM_TYPES = [
  'bedroom','suite','kitchen','living','dining',
  'bathroom','laundry','hall','closet','garage','office',
]

export const Room = z.object({
  id: z.string(),
  type: z.enum(ROOM_TYPES),
  label: z.string(),
  polygon: z.array(Vec2).min(3),
})

export const FIXTURE_KINDS = [
  'toilet','sink','shower','stove','fridge','bed','table','sofa',
]

export const Fixture = z.object({
  id: z.string(),
  kind: z.enum(FIXTURE_KINDS),
  pos: Vec2,
  rot: z.number().default(0),
})

export const Level = z.object({
  id: z.string(),
  name: z.string(),
  elevation: z.number().default(0),
  height: z.number().min(2.3).default(2.7),
  walls: z.array(Wall),
  rooms: z.array(Room),
  openings: z.array(Opening).default([]),
  fixtures: z.array(Fixture).default([]),
})

export const House = z.object({
  meta: z.object({
    name: z.string(),
    locale: z.string().default('en-US'),
  }),
  levels: z.array(Level).min(1),
})
