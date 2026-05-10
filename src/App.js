import { useT, availableLocales } from './i18n/index.js'
import { HouseProvider } from './HouseContext.js'
import Prompt from './views/Prompt.js'
import Plan2D from './views/Plan2D.js'
import Plan3D from './views/Plan3D.js'
import Issues from './views/Issues.js'

function Header() {
  const { t, locale, setLocale } = useT()
  return pug`
    header.app__header
      .app__title
        h1= t('app.title')
        small= t('app.subtitle')
      select.app__locale(value=locale onChange=(e) => setLocale(e.target.value))
        each l in availableLocales()
          option(key=l value=l)= l
  `
}

export default function App() {
  const { t } = useT()
  return pug`
    HouseProvider
      .app
        Header
        .app__body
          aside.app__sidebar
            Prompt
            Issues
          main.app__main
            section.app__pane
              h2= t('panes.plan2d')
              Plan2D
            section.app__pane
              h2= t('panes.plan3d')
              Plan3D
  `
}
