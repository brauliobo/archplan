export const asset = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`
export const model = (path) => asset(`models/${path}`)
