import bungalow from '../../plans/sample-bungalow.yml'
import casaModerna from '../../plans/casa-terrea-moderna.yml'

export const SAMPLES = [
  { id: 'casa-moderna', name: 'Casa Térrea Moderna 10×12', plan: casaModerna },
  { id: 'bungalow',     name: 'Sample Bungalow',           plan: bungalow },
]

export const sampleById = (id) => SAMPLES.find((s) => s.id === id) || SAMPLES[0]

export const defaultSample = () => SAMPLES[0]
