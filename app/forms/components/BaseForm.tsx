/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import type { IAttributes } from 'oneentry/dist/base/utils'
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
    const [formFields, setFormFields] = useState<IAttributes[] | null>(null)
    const [moduleFormConfig, setModuleFormConfig] = useState<any>(null)
    // Captcha
    const [isCaptcha, setIsCaptcha] = useState<boolean>(false)
    const [isValid, setIsValid] = useState<boolean>(false)
    const [token, setToken] = useState<string | null>(null)

    // Fetch form data and set state
    useEffect(() => {
      const fetchData = async () => {
        try {
          const response = await Forms.getFormByMarker(formMarker)

          if (response) {
            const sortedFields = response.attributes
              .slice()
              .sort((a: { position: number }, b: { position: number }) => a.position - b.position)

            setFormFields(sortedFields)

            // Set form config
            if (response.moduleFormConfigs && response.moduleFormConfigs.length > 0) {
              setModuleFormConfig(response.moduleFormConfigs[0])
            }
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
            const result = await FormData.postFormsData({
              formIdentifier: formMarker,
              formData: Object.values(fieldsData),
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
      [fieldsData, formFields, FormData, moduleFormConfig, formMarker]
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
            {formFields?.map((field: IAttributes, index: Key | number) => {
              if (field.type === 'spam') {
                return (
                  <FormReCaptcha
                    key={field.marker || index}
                    setToken={setToken}
                    setIsCaptcha={setIsCaptcha}
                    siteKey={field.settings?.captcha.key || ''}
                    setIsValid={setIsValid}
                  />
                )
              } else {
                const ariaLabel = field.additionalFields.find(
                  (el: { marker: string }) => el.marker === 'ariaLabel'
                )?.value
                const placeholder = field.additionalFields.find(
                  (el: { marker: string }) => el.marker === 'placeholder'
                )?.value

                return (
                  <FormInput
                    key={field.marker || index}
                    index={index as number}
                    value={field.value}
                    marker={field.marker}
                    type={field.type}
                    localizeInfos={field.localizeInfos}
                    validators={field.validators}
                    listTitles={field.listTitles?.map(
                      (item: {
                        title: string
                        value: string | number | null
                        position: number
                        extended: { value: string | number | null; type: string | number | null }
                      }) => ({
                        title: item.title,
                        value: item.value !== null ? String(item.value) : ''
                      })
                    )}
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
