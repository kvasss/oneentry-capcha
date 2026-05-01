import { useEffect, useState } from 'react'

declare global {
  interface Window {
    grecaptcha?: {
      enterprise?: {
        ready: (callback: () => void) => void
        execute: (key: string, options: { action: string }) => Promise<string>
      }
    }
  }
}

export interface CaptchaValidationObject {
  event: {
    token: string
    siteKey: string
  }
}

export function useEnterpriseCaptcha(
  siteKey: string | undefined,
  action: string = 'login'
): CaptchaValidationObject | null {
  const [validation, setValidation] = useState<CaptchaValidationObject | null>(null)

  useEffect(() => {
    if (!siteKey) return

    const handleLoaded = () => {
      window.grecaptcha?.enterprise?.ready(() => {
        window.grecaptcha?.enterprise
          ?.execute(siteKey, { action })
          .then((token) => setValidation({ event: { token, siteKey } }))
          .catch(() => {})
      })
    }

    const script = document.createElement('script')
    script.src = `https://www.google.com/recaptcha/enterprise.js?render=${siteKey}`
    script.addEventListener('load', handleLoaded)
    document.body.appendChild(script)

    return () => {
      script.removeEventListener('load', handleLoaded)
      script.remove()
    }
  }, [siteKey, action])

  return validation
}
