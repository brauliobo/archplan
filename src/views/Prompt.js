import { useState } from 'react'
import { useHouse } from '../HouseContext.js'
import { useT } from '../i18n/index.js'
import { generatePlan } from '../ai/plan.js'
import { getApiKey, setApiKey } from '../ai/apiKey.js'
import { SAMPLES } from '../catalog/samples.js'

export default function Prompt() {
  const { house, setHouse } = useHouse()
  const { t, locale } = useT()
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const [apiKey, setApiKeyState] = useState(getApiKey())
  const [keySaved, setKeySaved] = useState(false)

  const saveKey = () => {
    setApiKey(apiKey.trim())
    setKeySaved(true)
    setTimeout(() => setKeySaved(false), 2000)
  }

  const submit = async () => {
    if (!text.trim() || busy) return
    setErr(null)
    if (!getApiKey()) {
      setErr(t('errors.no_api_key'))
      return
    }
    setBusy(true)
    try {
      const { house: next } = await generatePlan(text, house)
      next.meta.locale = locale
      const ok = setHouse(next)
      if (!ok) setErr(t('errors.validation'))
    } catch (e) {
      setErr(e.message === 'NO_API_KEY' ? t('errors.no_api_key') : t('errors.ai_failed', { message: e.message }))
    } finally {
      setBusy(false)
    }
  }

  return pug`
    .prompt
      .prompt__key
        label= t('prompt.api_key_label')
        .prompt__keyrow
          input.prompt__keyinput(
            type="password"
            value=apiKey
            placeholder=t('prompt.api_key_placeholder')
            onChange=(e) => setApiKeyState(e.target.value)
          )
          button.prompt__keysave(onClick=saveKey)= t('prompt.api_key_save')
        if keySaved
          small.prompt__keyok= t('prompt.api_key_saved')
        small.prompt__keywarn= t('prompt.api_key_warning')
      textarea.prompt__input(
        value=text
        placeholder=t('prompt.placeholder')
        onChange=(e) => setText(e.target.value)
        rows=6
      )
      .prompt__row
        button.prompt__submit(onClick=submit disabled=busy)
          = busy ? t('prompt.generating') : (house ? t('prompt.edit') : t('prompt.submit'))
        select.prompt__sample(onChange=(e) => setHouse(SAMPLES.find((s) => s.id === e.target.value).plan) value="")
          option(value="" disabled)= t('prompt.load_sample')
          each s in SAMPLES
            option(key=s.id value=s.id)= s.name
      small.prompt__example(onClick=() => setText(t('prompt.example')))= t('prompt.example')
      if err
        .prompt__error= err
  `
}
