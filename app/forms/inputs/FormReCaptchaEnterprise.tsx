/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Dispatch, JSX } from 'react'
import { useEffect } from 'react'
import ReCAPTCHA from 'react-google-recaptcha-enterprise'

import { getApi } from '@/app/api/api'
/**
 * FormReCaptchaEnterprise component for Google reCAPTCHA integration.
 * Provides bot protection for forms using Google's reCAPTCHA service.
 * @param   {object}            props              - FormReCaptcha props.
 * @param   {Dispatch<string>}  props.setToken     - Function to set the token.
 * @param   {Dispatch<boolean>} props.setIsCaptcha - Function to set captcha state.
 * @param   {string}            props.captchaKey   - Captcha key.
 * @returns {JSX.Element}                          FormReCaptcha component.
 */
const FormReCaptchaEnterprise = ({
  // siteKey,
  token,
  setToken,
  setIsCaptcha,
  setIsValid
}: {
  siteKey: string
  token: string | null
  setToken: Dispatch<string>
  setIsCaptcha: Dispatch<boolean>
  setIsValid: Dispatch<boolean>
}): JSX.Element => {
  const { System } = getApi()
  const siteKey = '6Lc6I2gsAAAAAG5dYj7AratZ-5mC2r_m5325Mo2J';

  /**
   * Sets the captcha state to true when component mounts
   */
  useEffect(() => {
    setIsCaptcha(true)
  }, [setIsCaptcha])

  useEffect(() => {
    if (!token) {
      return
    }
    const validateCapcha = async () => {
      const data = {
        token: token,
        expectedAction: 'login',
        siteKey: siteKey
      }
      const isValid = await System.validateCapcha(data)
      setIsValid(isValid)
    }
    validateCapcha()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  /**
   * Renders the reCAPTCHA widget with dark theme
   * @param   {string | null} token - reCAPTCHA token
   * @returns {JSX.Element}         JSX.Element
   */
  return (
    <ReCAPTCHA
      sitekey={siteKey}
      onChange={(token: string | null) => setToken(token || '')}
      className={'mx-auto'}
      theme='dark'
    />
  )
}

export default FormReCaptchaEnterprise
