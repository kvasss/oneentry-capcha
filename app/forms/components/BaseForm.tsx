/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import type { IFormAttribute } from 'oneentry/dist/forms/formsInterfaces'
import type { FormEvent, JSX, Key, ReactNode } from 'react'
import { memo, useCallback, useEffect, useState } from 'react'

import { getApi } from '@/app/api/api'

import FormInput from '../inputs/FormInput'
import FormReCaptcha from '../inputs/FormReCaptcha'
import ErrorMessage from './ErrorMessage'
import Loader from './Loader'

interface BaseFormProps {
  className?: string
  formMarker: string
  formClassName: string
  icon: ReactNode
  description: ReactNode
  submitLabel: string
  successMessage: string
}

const BaseForm = memo(
  ({
    className = '',
    formMarker,
    formClassName,
    icon,
    description,
    submitLabel,
    successMessage
  }: BaseFormProps): JSX.Element => {
    const { Forms, FormData } = getApi()
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    // form
    const [fieldsData, setFieldsData] = useState<Record<string, any> | null>(null)
    const [formFields, setFormFields] = useState<IFormAttribute[] | null>(null)
    const [moduleFormConfig, setModuleFormConfig] = useState<any>(null)
    // Captcha
    const [isCaptcha, setIsCaptcha] = useState<boolean>(false)
    const [isValid, setIsValid] = useState<boolean>(false)
    const [token, setToken] = useState<string | null>(null)

    // Get a fresh reCAPTCHA Enterprise token at submit time
    // (tokens expire ~2 minutes after issuance, and the server expects a recent one)
    const getFreshCaptchaToken = useCallback(
      async (siteKey: string, action: string): Promise<string | null> => {
        if (typeof window === 'undefined' || !window.grecaptcha?.enterprise) return null
        return new Promise<string | null>((resolve) => {
          window.grecaptcha!.enterprise!.ready(async () => {
            try {
              const fresh = await window.grecaptcha!.enterprise!.execute(siteKey, { action })
              resolve(fresh || null)
            } catch {
              resolve(null)
            }
          })
        })
      },
      []
    )

    // Fetch form data and set state
    useEffect(() => {
      const fetchData = async () => {
        try {
          const response = await Forms.getFormByMarker(formMarker)

          if (response && 'attributes' in response) {
            const sortedFields = response.attributes
              .slice()
              .sort((a: { position: number }, b: { position: number }) => a.position - b.position)

            setFormFields(sortedFields)

            // Set form config
            if (response.moduleFormConfigs && response.moduleFormConfigs.length > 0) {
              setModuleFormConfig(response.moduleFormConfigs[0])
            }
          } else if (response && 'message' in response) {
            setError((response as any).message || 'Failed to load form data')
          }
        } catch (err) {
          setError((err as Error).message || 'Failed to load form data')
        }
      }

      fetchData()
    }, [Forms, formMarker])
    // console.log(moduleFormConfig)

    const onSubmitFormHandle = useCallback(
      async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (fieldsData && formFields && moduleFormConfig) {
          try {
            setIsLoading(true)
            setError(null)

            const spamField = formFields.find((f) => f.type === 'spam')
            const formData = Object.values(fieldsData)
            if (spamField) {
              const siteKey = (spamField as any).settings?.captcha?.key || ''
              const action = (spamField as any).settings?.captcha?.action || 'login'
              console.log('[captcha] siteKey:', siteKey, 'action:', action, 'spam settings:', (spamField as any).settings)
              const freshToken = siteKey ? await getFreshCaptchaToken(siteKey, action) : null
              const tokenToSend = freshToken || token
              if (tokenToSend) {
                formData.push({ marker: spamField.marker, type: 'spam', value: tokenToSend })
              }
            }

            const result = await FormData.postFormsData({
              formIdentifier: formMarker,
              formData,
              formModuleConfigId: moduleFormConfig.id,
              moduleEntityIdentifier: moduleFormConfig.entityIdentifiers[0].id,
              replayTo: null,
              status: 'sent'
            })

            console.log(result)

            if (result && typeof result === 'object' && 'error' in result) {
              setError((result as any).error)
            } else {
              setIsSuccess(true)
            }
          } catch (e: any) {
            setError(e.message)
          } finally {
            setIsLoading(false)
          }
        }
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [fieldsData, formFields, FormData, moduleFormConfig, formMarker, token, getFreshCaptchaToken]
    )

    const canSubmit = true
    // const canSubmit = isValid && isCaptcha

    if (isSuccess) {
      return (
        <div className={formClassName + ' ' + className}>
          <div className='contact-info'>
            {icon}
            <p className='contact-description'>{successMessage}</p>
          </div>
        </div>
      )
    }

    return (
      <form className={formClassName + ' ' + className} onSubmit={onSubmitFormHandle}>
        <div className='contact-info flex flex-col gap-3'>
          {icon}

          {/* title */}
          <p className='contact-description'>{description}</p>

          {/* formFields */}
          <div className='input-wrapper'>
            {formFields?.map((field: IFormAttribute, index: Key | number) => {
              if (field.type === 'spam') {
                return (
                  <FormReCaptcha
                    key={field.marker || index}
                    setToken={setToken}
                    setIsCaptcha={setIsCaptcha}
                    siteKey={(field as any).settings?.captcha?.key || ''}
                    action={(field as any).settings?.captcha?.action}
                    setIsValid={setIsValid}
                  />
                )
              } else {
                const additionalFields = Array.isArray(field.additionalFields)
                  ? field.additionalFields
                  : []
                const ariaLabel = additionalFields.find(
                  (el: { marker: string }) => el.marker === 'ariaLabel'
                )?.value
                const placeholder = additionalFields.find(
                  (el: { marker: string }) => el.marker === 'placeholder'
                )?.value

                return (
                  <FormInput
                    key={field.marker || index}
                    index={index as number}
                    value={(field as any).value}
                    marker={field.marker}
                    type={field.type}
                    localizeInfos={field.localizeInfos}
                    validators={field.validators}
                    listTitles={field.listTitles?.map((item) => ({
                      title: item.title,
                      value: item.value != null ? String(item.value as any) : ''
                    }))}
                    ariaLabel={ariaLabel || ''}
                    placeholder={placeholder || ''}
                    setFieldsData={setFieldsData}
                    className='border border-gray-300 w-full rounded-3xl px-3 py-2'
                  />
                )
              }
            })}
          </div>
        </div>

        {/* submit button */}
        <div className='button-wrapper mt-3'>
          <button type='submit' disabled={!canSubmit} className='submit-button primary-button border border-orange-500 w-full rounded-3xl py-1.5'>
            {isLoading ? <Loader /> : submitLabel}
          </button>
        </div>

        {error && <ErrorMessage error={error} />}
      </form>
    )
  }
)

BaseForm.displayName = 'BaseForm'

export default BaseForm
