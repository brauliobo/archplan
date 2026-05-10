const STORAGE_KEY = 'archplan.anthropic_api_key'

export const getApiKey = () => {
  const env = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (env) return env
  try { return localStorage.getItem(STORAGE_KEY) || '' } catch { return '' }
}

export const setApiKey = (key) => {
  try { localStorage.setItem(STORAGE_KEY, key) } catch {}
}

export const clearApiKey = () => {
  try { localStorage.removeItem(STORAGE_KEY) } catch {}
}
