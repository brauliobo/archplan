export const ROOM_COLORS = {
  bedroom:  { fill: '#cfe3ff', floor: '#d4c5a8' },
  suite:    { fill: '#bcd3ff', floor: '#c8b896' },
  kitchen:  { fill: '#ffe3c7', floor: '#b8a888' },
  living:   { fill: '#dff3d3', floor: '#9a8868' },
  dining:   { fill: '#e7f0d7', floor: '#a89878' },
  bathroom: { fill: '#cfeff0', floor: '#9bb0b3' },
  laundry:  { fill: '#e0e0e0', floor: '#aaa8a3' },
  hall:     { fill: '#f3f3f3', floor: '#bcb09a' },
  closet:   { fill: '#efe3ff', floor: '#c0b290' },
  garage:   { fill: '#dcdcdc', floor: '#888888' },
  office:   { fill: '#fff0bd', floor: '#c8b890' },
}

export const fillFor  = (type) => (ROOM_COLORS[type]  && ROOM_COLORS[type].fill)  || '#eee'
export const floorFor = (type) => (ROOM_COLORS[type] && ROOM_COLORS[type].floor) || '#bbb'

export const MATERIALS = {
  wallExterior:    { color: '#f1ede4', roughness: 0.85 },
  wallInterior:    { color: '#f5f1e8', roughness: 0.9 },
  slab:            { color: '#cfcabd', roughness: 0.8 },
  parapet:         { color: '#e8e3d6', roughness: 0.85 },
  glass:           { color: '#bcdfe8', opacity: 0.35, roughness: 0.05, metalness: 0.1, transmission: 0.6 },
  windowFrame:     { color: '#3a3a3a', roughness: 0.5 },
  doorFrame:       { color: '#7a6a55', roughness: 0.6 },
  doorLeafExt:     { color: '#3d2b1f', roughness: 0.55, metalness: 0.05 },
  doorLeafInt:     { color: '#8d6e4a', roughness: 0.55, metalness: 0.05 },
  doorHandle:      { color: '#bfa46f', metalness: 0.7, roughness: 0.3 },
  counterTop:      { color: '#2a2826', roughness: 0.2, metalness: 0.35 },
  groundLot:       { color: '#c9c4a4', roughness: 0.95 },
  groundOutside:   { color: '#aab98a', roughness: 1 },
  sky:             '#cfe6f4',
}
