// dimensions in meters: [width (x), depth (y), height (z)] — z is up in the 3D scene
// `model` is a GLB filename in /public/models/furniture/. Optional — kinds without one fall back to a colored box.
export const FIXTURES = {
  toilet:               { size: [0.4, 0.7, 0.8],   color: '#cfd8dc', model: 'toilet.glb' },
  sink:                 { size: [0.6, 0.45, 0.85], color: '#b0bec5', model: 'kitchenSink.glb' },
  bath_sink:            { size: [0.55, 0.45, 0.85], color: '#cfd8dc', model: 'bathroomSink.glb' },
  shower:               { size: [0.9, 0.9, 2.0],   color: '#90a4ae', model: 'showerRound.glb' },
  bathtub:              { size: [1.7, 0.75, 0.6],  color: '#eceff1', model: 'bathtub.glb' },
  vanity:               { size: [1.0, 0.5, 0.85],  color: '#d7ccc8', model: 'bathroomCabinetDrawer.glb' },
  mirror:               { size: [0.8, 0.05, 1.0],  color: '#cfd8dc', model: 'bathroomMirror.glb' },

  bed:                  { size: [1.6, 2.0, 0.5],   color: '#a1887f', model: 'bedDouble.glb' },
  bed_single:           { size: [1.0, 2.0, 0.5],   color: '#a1887f', model: 'bedSingle.glb' },
  nightstand:           { size: [0.45, 0.4, 0.55], color: '#8d6e63', model: 'sideTableDrawers.glb' },
  wardrobe:             { size: [1.6, 0.6, 2.0],   color: '#6d4c41', model: 'bookcaseClosedDoors.glb' },
  dresser:              { size: [1.2, 0.5, 0.85],  color: '#8d6e63', model: 'cabinetBedDrawerTable.glb' },

  stove:                { size: [0.6, 0.6, 0.9],   color: '#9e9e9e', model: 'kitchenStove.glb' },
  fridge:               { size: [0.7, 0.7, 1.8],   color: '#cfd8dc', model: 'kitchenFridge.glb' },
  dishwasher:           { size: [0.6, 0.6, 0.85],  color: '#bdbdbd', model: 'washer.glb' },
  microwave:            { size: [0.5, 0.35, 0.3],  color: '#424242', model: 'kitchenMicrowave.glb' },
  range_hood:           { size: [0.6, 0.5, 0.4],   color: '#9e9e9e', model: 'hoodModern.glb' },
  kitchen_cabinet_low:  { size: [0.6, 0.6, 0.85],  color: '#a1887f', model: 'kitchenCabinet.glb' },
  kitchen_cabinet_high: { size: [0.6, 0.35, 0.7],  color: '#a1887f', model: 'kitchenCabinetUpper.glb' },
  kitchen_island:       { size: [1.6, 0.9, 0.9],   color: '#a1887f', model: 'kitchenBar.glb' },

  sofa:                 { size: [2.4, 0.9, 0.9],   color: '#6d4c41', model: 'loungeSofaLong.glb' },
  armchair:             { size: [0.9, 0.9, 0.9],   color: '#8d6e63', model: 'loungeChair.glb' },
  coffee_table:         { size: [1.1, 0.6, 0.4],   color: '#5d4037', model: 'tableCoffee.glb' },
  table:                { size: [1.4, 0.8, 0.75],  color: '#8d6e63', model: 'tableCross.glb' },
  chair:                { size: [0.45, 0.5, 0.85], color: '#6d4c41', model: 'chairModernCushion.glb' },
  bookshelf:            { size: [1.0, 0.35, 1.8],  color: '#5d4037', model: 'bookcaseOpen.glb' },
  tv:                   { size: [1.4, 0.1, 0.8],   color: '#212121', model: 'televisionModern.glb' },
  tv_large:             { size: [2.0, 0.1, 1.15],  color: '#212121', model: 'televisionModern.glb' },
  tv_stand:             { size: [1.6, 0.4, 0.45],  color: '#3e2723', model: 'cabinetTelevision.glb' },
  rug:                  { size: [2.5, 1.7, 0.02],  color: '#bcaaa4', model: 'rugRectangle.glb' },
  plant:                { size: [0.45, 0.45, 1.2], color: '#558b2f', model: 'pottedPlant.glb' },
  floor_lamp:           { size: [0.35, 0.35, 1.6], color: '#fff59d', model: 'lampRoundFloor.glb' },
  table_lamp:           { size: [0.25, 0.25, 0.5], color: '#fff59d', model: 'lampRoundTable.glb' },
  ceiling_lamp:         { size: [0.4, 0.4, 0.3],   color: '#fff59d', model: 'lampSquareCeiling.glb' },

  washer:               { size: [0.6, 0.6, 0.85],  color: '#eceff1', model: 'washer.glb' },
  dryer:                { size: [0.6, 0.6, 0.85],  color: '#eceff1', model: 'dryer.glb' },
}

export const FIXTURE_SIZE  = Object.fromEntries(Object.entries(FIXTURES).map(([k, v]) => [k, v.size]))
export const FIXTURE_COLOR = Object.fromEntries(Object.entries(FIXTURES).map(([k, v]) => [k, v.color]))
