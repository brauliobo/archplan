import { createContext, createElement, useContext, useState, useCallback } from 'react'
import en from './locales/en.yml'
import ptBR from './locales/pt-BR.yml'

const LOCALES = { en, 'pt-BR': ptBR }
const DEFAULT = 'en'

export const detectLocale = () => {
  const tags = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || DEFAULT])
  for (const tag of tags) {
    if (LOCALES[tag]) return tag
    const prefix = tag.split('-')[0]
    const match = Object.keys(LOCALES).find((k) => k === prefix || k.startsWith(prefix + '-'))
    if (match) return match
  }
  return DEFAULT
}

const get = (obj, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj)

const interpolate = (str, params) =>
  params ? str.replace(/\{(\w+)\}/g, (_, k) => (params[k] != null ? String(params[k]) : `{${k}}`)) : str

export const translate = (locale, key, params) => {
  const v = get(LOCALES[locale], key) ?? get(LOCALES[DEFAULT], key) ?? key
  return typeof v === 'string' ? interpolate(v, params) : v
}

const Ctx = createContext({ locale: DEFAULT, t: (k) => k, setLocale: () => {} })

export function I18nProvider({ children }) {
  const [locale, setLocale] = useState(detectLocale())
  const t = useCallback((key, params) => translate(locale, key, params), [locale])
  return createElement(Ctx.Provider, { value: { locale, t, setLocale } }, children)
}

export const useT = () => useContext(Ctx)

export const availableLocales = () => Object.keys(LOCALES)
