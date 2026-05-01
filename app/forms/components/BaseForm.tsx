/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import type { IFormAttribute } from 'oneentry/dist/forms/formsInterfaces'
import type { FormEvent, JSX, Key, ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'

import { getApi } from '@/app/api/api'

import FormInput from './inputs/FormInput'
import { useEnterpriseCaptcha } from './hooks/useEnterpriseCaptcha'
import ErrorMessage from './ErrorMessage'
import Loader from './Loader'

interface SpamSettings {
  captcha: { key: string; action?: string }
}

type SpamField = IFormAttribute & { settings: SpamSettings }

interface BaseFormProps {
  className?: string
  formMarker: string
  formClassName: string
  icon: ReactNode
  description: ReactNode
  submitLabel: string
  successMessage: string
}

const BaseForm = ({
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
  const [fieldsData, setFieldsData] = useState<Record<string, any> | null>(null)
  const [formFields, setFormFields] = useState<IFormAttribute[] | null>(null)
  const [moduleFormConfig, setModuleFormConfig] = useState<any>(null)

  const spamField = useMemo(
    () => formFields?.find((f) => f.type === 'spam') as SpamField | undefined,
    [formFields]
  )
  const captcha = useEnterpriseCaptcha(
    spamField?.settings?.captcha?.key,
    spamField?.settings?.captcha?.action
  )

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await Forms.getFormByMarker(formMarker)

        if (response && 'attributes' in response) {
          const sortedFields = response.attributes
            .slice()
            .sort((a: { position: number }, b: { position: number }) => a.position - b.position)

          setFormFields(sortedFields)

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

  const onSubmitFormHandle = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!fieldsData || !formFields || !moduleFormConfig) return

    try {
      setIsLoading(true)
      setError(null)

      const formData = Object.values(fieldsData)
      if (spamField && captcha) {
        formData.push({ marker: spamField.marker, type: 'spam', value: captcha })
      }

      const result = await FormData.postFormsData({
        formIdentifier: formMarker,
        formData,
        formModuleConfigId: moduleFormConfig.id,
        moduleEntityIdentifier: moduleFormConfig.entityIdentifiers[0].id,
        replayTo: null,
        status: 'sent'
      })

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

        <p className='contact-description'>{description}</p>

        <div className='input-wrapper'>
          {formFields?.map((field: IFormAttribute, index: Key | number) => {
            if (field.type === 'spam') return null

            const additionalFields = Array.isArray(field.additionalFields) ? field.additionalFields : []
            const ariaLabel = additionalFields.find((el: { marker: string }) => el.marker === 'ariaLabel')?.value
            const placeholder = additionalFields.find((el: { marker: string }) => el.marker === 'placeholder')?.value

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
          })}
        </div>
      </div>

      <div className='button-wrapper mt-3'>
        <button type='submit' className='submit-button primary-button border border-orange-500 w-full rounded-3xl py-1.5'>
          {isLoading ? <Loader /> : submitLabel}
        </button>
      </div>

      {error && <ErrorMessage error={error} />}
    </form>
  )
}

export default BaseForm
