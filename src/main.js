import React from 'react'
import { createRoot } from 'react-dom/client'
import { I18nProvider } from './i18n/index.js'
import App from './App.js'
import './styles.css'

createRoot(document.getElementById('root')).render(
  React.createElement(
    React.StrictMode,
    null,
    React.createElement(I18nProvider, null, React.createElement(App)),
  ),
)
