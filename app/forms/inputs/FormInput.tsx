/* eslint-disable @typescript-eslint/no-explicit-any */
import type { JSX } from 'react'
import { useEffect, useRef, useState } from 'react'

import useInputMask from '../hooks/useInputMask'

enum FormFieldsEnum {
  string = 'text',
  email = 'email',
  password = 'password',
  phone = 'tel',
  date = 'date',
  text = 'textarea',
  list = 'list',
  spam = 'spam',
  button = 'button'
}

interface ListOption {
  value: string
  title: string
}

interface ListSelectProps {
  field: { marker: string; listTitles?: ListOption[] }
  cn: string
  required: boolean
  inputValue: string
  setInputValue: (value: string) => void
}

const ListSelect = ({ field, cn, required, inputValue, setInputValue }: ListSelectProps) => {
  return (
    <select
      id={field.marker}
      className={cn}
      required={required}
      value={inputValue}
      onChange={(val) => setInputValue(val.currentTarget.value)}
    >
      {field.listTitles?.map((option) => {
        return (
          <option key={option.value} value={option.value}>
            {option.title}
          </option>
        )
      })}
    </select>
  )
}

interface TextareaProps {
  field: { marker: string }
  cn: string
  required: boolean
  inputValue: string
  placeholder: string
  setInputValue: (value: string) => void
}

const Textarea = ({ cn, inputValue, field, placeholder, required, setInputValue }: TextareaProps) => {
  return (
    <textarea
      className={cn}
      value={inputValue}
      id={field.marker}
      placeholder={placeholder}
      required={required}
      onChange={(val) => setInputValue(val.currentTarget.value)}
    />
  )
}

/**
 * FormInput component for rendering various types of form fields.
 * Handles text inputs, textareas, select dropdowns, and password fields with show/hide functionality.
 * @param   {object}              field                 - Field properties.
 * @param   {string}              field.marker          - Field marker.
 * @param   {string}              field.type            - Field type.
 * @param   {string | number}     field.value           - Field value.
 * @param   {Record<string, any>} [field.validators]    - Field validators.
 * @param   {number}              [field.index]         - Field index.
 * @param   {Record<string, any>} [field.listTitles]    - List titles.
 * @param   {Record<string, any>} [field.localizeInfos] - Localize info.
 * @param   {string}              [field.className]     - Class name.
 * @returns {JSX.Element}                               Form input.
 */
const FormInput = (field: {
  marker: string
  type: string
  value: string | number
  validators: Record<string, any>
  index: number
  listTitles?: ListOption[]
  localizeInfos?: Record<string, any>
  className: string
  ariaLabel: string
  placeholder: string
  setFieldsData: any
}): JSX.Element => {
  const { localizeInfos, marker, validators } = field

  /** Инициализируем хук маски */
  const { inputRef, applyMask, ensureCaretAfterPrefix, getProtectedLength } = useInputMask()

  /** Получаем маску и префикс из валидатора */
  const fieldMask = validators?.['fieldMaskValidator']?.maskValue || null
  const fieldPrefix = validators?.['fieldMaskValidator']?.hint || ''

  /** Длина защищенной области (префикс + разделители после него) */
  const protectedLength = fieldMask ? getProtectedLength(fieldMask, fieldPrefix) : 0

  /** Максимальное количество цифр, допустимое по маске (после префикса) */
  const maxDigits = fieldMask
    ? fieldMask
        .slice(fieldPrefix.length)
        .split('')
        .filter((c: string) => c === '#' || c === '9').length
    : Infinity

  /* Check if the field is required based on validators */
  const required = validators?.['requiredValidator']?.strict || false

  /**
   * Инициализируем значение с учетом маски и префикса
   * @returns {string} - Инициализированное значение
   */
  const getInitialValue = (): string => {
    const initialValue = field.value?.toString() || ''
    if (fieldMask && initialValue) {
      // Если есть значение, применяем маску
      return applyMask(initialValue, fieldMask, fieldPrefix)
    }
    // Если поле пустое, возвращаем пустую строку (чтобы показывался placeholder)
    return initialValue
  }

  const [inputValue, setInputValue] = useState<string>(getInitialValue())
  const prevFieldValueRef = useRef<string>(field.value?.toString() || '')

  const fieldType = (FormFieldsEnum as any)[marker.indexOf('email') !== -1 ? 'email' : (field.type as any)]

  /** Calculate the actual input type */
  const type = fieldType || 'text'

  const cn = field.className || 'border rounded-md px-3 py-2'
  const placeholder = field.placeholder || localizeInfos?.title

  useEffect(() => {
    field.setFieldsData((prev: Record<string, any>) => ({
      ...prev,
      [marker]: {
        marker: marker,
        type: field.type,
        value: inputValue
      }
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue])

  /**
   * Обработчик изменения значения для маскированного ввода
   * @param e - событие изменения
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value
    const selectionStart = e.target.selectionStart ?? 0

    if (fieldMask) {
      // Удаляем защищенную область из rawValue для подсчета цифр
      let rawWithoutProtected = rawValue
      let cursorOffset = selectionStart

      if (protectedLength && rawValue.length >= protectedLength) {
        rawWithoutProtected = rawValue.slice(protectedLength)
        cursorOffset = Math.max(0, selectionStart - protectedLength)
      }

      // Проверяем, не превышено ли максимальное количество цифр
      const totalDigits = rawWithoutProtected.replace(/\D/g, '').length
      if (totalDigits > maxDigits) {
        return
      }

      // Подсчитываем количество цифр до курсора (без защищенной области)
      const digitsBeforeCursor = rawWithoutProtected.slice(0, cursorOffset).replace(/\D/g, '').length

      const newValue = applyMask(rawValue, fieldMask, fieldPrefix)
      setInputValue(newValue)

      // Корректируем позицию курсора
      setTimeout(() => {
        if (inputRef.current && newValue) {
          // Находим позицию в newValue, где будет такое же количество цифр
          let digitCount = 0
          let position = protectedLength

          for (let i = protectedLength; i < newValue.length; i++) {
            if (/\d/.test(newValue[i])) {
              digitCount++
              if (digitCount === digitsBeforeCursor) {
                position = i + 1
                break
              }
            }
          }

          // Если курсор на специальном символе, перемещаем его за него
          while (position < newValue.length && !/\d/.test(newValue[position])) {
            position++
          }

          inputRef.current.setSelectionRange(position, position)
        }
      }, 0)
    } else {
      setInputValue(rawValue)
    }
  }

  /**
   * Обработчики для защиты префикса от редактирования
   */
  const handleFocus = () => {
    if (protectedLength && inputValue) {
      ensureCaretAfterPrefix(protectedLength)
    }
  }

  /**
   * Обработчик для события клика
   */
  const handleClick = () => {
    if (protectedLength && inputValue) {
      ensureCaretAfterPrefix(protectedLength)
    }
  }

  /**
   * Обработчик для события нажатия клавиши
   * @param e - событие
   * @returns void
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!fieldMask || !inputRef.current || !inputValue) return

    const cursorPos = inputRef.current.selectionStart ?? 0

    // Запрещаем удаление в защищенной области (префикс + дефис)
    if (e.key === 'Backspace') {
      if (cursorPos < protectedLength) {
        e.preventDefault()
        return
      }

      // Если курсор прямо на границе защищенной области — удаляем первую цифру после неё
      if (cursorPos === protectedLength) {
        e.preventDefault()
        // Находим первую цифру после protectedLength и удаляем её
        let digitPos = -1
        for (let i = protectedLength; i < inputValue.length; i++) {
          if (/\d/.test(inputValue[i])) {
            digitPos = i
            break
          }
        }
        if (digitPos !== -1) {
          const newRaw = inputValue.slice(0, digitPos) + inputValue.slice(digitPos + 1)
          const newValue = applyMask(newRaw, fieldMask, fieldPrefix)
          setInputValue(newValue || '')
          setTimeout(() => {
            if (inputRef.current) {
              inputRef.current.setSelectionRange(protectedLength, protectedLength)
            }
          }, 0)
        }
        return
      }

      // Если символ перед курсором - разделитель (не цифра), пропускаем его
      const charBeforeCursor = inputValue[cursorPos - 1]
      if (charBeforeCursor && !/\d/.test(charBeforeCursor)) {
        let newPos = cursorPos - 1
        while (newPos > protectedLength && !/\d/.test(inputValue[newPos - 1])) {
          newPos--
        }
        if (newPos > protectedLength) {
          e.preventDefault()
          // Удаляем цифру программно
          const beforeCursor = inputValue.slice(0, newPos - 1)
          const afterCursor = inputValue.slice(newPos)
          const newRawValue = beforeCursor + afterCursor

          const newValue = applyMask(newRawValue, fieldMask, fieldPrefix)
          setInputValue(newValue)

          setTimeout(() => {
            if (inputRef.current && newValue) {
              const digitsBeforeDeleted = beforeCursor.slice(protectedLength).replace(/\D/g, '').length

              let digitCount = 0
              let position = protectedLength

              for (let i = protectedLength; i < newValue.length; i++) {
                if (/\d/.test(newValue[i])) {
                  if (digitCount === digitsBeforeDeleted) {
                    position = i
                    break
                  }
                  digitCount++
                }
              }

              inputRef.current.setSelectionRange(position, position)
            }
          }, 0)
        }
      }
    } else if (e.key === 'Delete') {
      if (cursorPos < protectedLength) {
        e.preventDefault()
      }
    }
  }

  /** Эффект для обновления состояния при изменении значения извне */
  useEffect(() => {
    const currentFieldValue = field.value?.toString() || ''

    // Обновляем только если значение изменилось извне (не из-за нашего ввода)
    if (currentFieldValue !== prevFieldValueRef.current) {
      prevFieldValueRef.current = currentFieldValue

      if (fieldMask) {
        setInputValue(applyMask(currentFieldValue, fieldMask, fieldPrefix))
      } else {
        setInputValue(currentFieldValue)
      }
    }
  }, [field.value, fieldMask, fieldPrefix, applyMask])

  /** Если нет поля или неправильный тип поля, возвращаем пустой элемент */
  if (!field || !type || field.type === 'button' || field.type === 'spam') {
    return <></>
  }

  return (
    <div className='input-group'>
      {/** Label for the form field hidden * Shows an asterisk if the field is required */}
      <label htmlFor={marker} className='hidden'>
        {localizeInfos?.title} {required && <span className='text-red-500'>*</span>}
      </label>
      {/** Render select dropdown for list type fields */}
      {field.type === 'list' && (
        <ListSelect field={field} cn={cn} required={required} inputValue={inputValue} setInputValue={setInputValue} />
      )}
      {/** Render textarea for textarea type fields */}
      {field.type === 'textarea' && (
        <Textarea
          field={field}
          cn={cn}
          required={required}
          inputValue={inputValue}
          setInputValue={setInputValue}
          placeholder={placeholder}
        />
      )}
      {/** Render standard input for all other field types text/password/email... */}
      {field.type === 'textarea' ||
      field.type === 'list' ||
      field.type === 'groupOfImages' ||
      marker === 'rating' ? null : (
        <input
          className={cn}
          type={type}
          value={inputValue}
          id={field.marker}
          placeholder={placeholder}
          required={required}
          ref={inputRef}
          onChange={handleChange}
          onFocus={handleFocus}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          autoComplete={fieldType === 'password' ? 'current-password' : 'off'}
          aria-label={field.ariaLabel}
        />
      )}
    </div>
  )
}

export default FormInput
