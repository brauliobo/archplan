import { createContext, createElement, useContext, useState, useMemo } from 'react'
import { House } from './schema.js'
import { checkHouse } from './standards.js'
import { defaultSample } from './catalog/samples.js'

const Ctx = createContext(null)

export function HouseProvider({ children }) {
  const [house, setHouseRaw] = useState(() => House.parse(defaultSample().plan))
  const [error, setError] = useState(null)

  const setHouse = (data) => {
    const parsed = House.safeParse(data)
    if (!parsed.success) {
      setError(parsed.error.issues)
      return false
    }
    setError(null)
    setHouseRaw(parsed.data)
    return true
  }

  const issues = useMemo(() => (house ? checkHouse(house) : []), [house])

  return createElement(Ctx.Provider, { value: { house, setHouse, error, issues } }, children)
}

export const useHouse = () => useContext(Ctx)
