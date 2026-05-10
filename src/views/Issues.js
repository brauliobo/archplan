import { useHouse } from '../HouseContext.js'
import { useT } from '../i18n/index.js'

function IssueRow({ issue }) {
  const { t } = useT()
  const family = issue.code.split('/')[0]
  const className = `issues__item issues__item--${family}`
  const text = t(issue.tKey, issue.params)
  return pug`
    li(className=className)
      span.issues__code= issue.code
      |
      span= text
  `
}

export default function Issues() {
  const { issues } = useHouse()
  const { t } = useT()
  if (!issues) return null
  const summary = issues.length === 0 ? t('issues.none') : t('issues.count', { count: issues.length })
  return pug`
    .issues
      .issues__title
        = t('issues.title')
        |
        small= summary
      ul.issues__list
        each i, idx in issues
          IssueRow(key=idx issue=i)
  `
}
