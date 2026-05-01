import { useRef } from 'react'

/**
 * Кастомный хук для маскирования ввода
 * @param mask Маска ввода, например "+# (###) ###-##-##"
 * @returns Объект с рефом и функциями для работы с маской
 */
const useInputMask = () => {
  const inputRef = useRef<HTMLInputElement>(null)

  /**
   * Функция для применения маски к значению
   * @param value - Значение, к которому нужно применить маску
   * @param mask - Маска ввода
   * @param prefix - Префикс, который нужно добавить к значению
   * @returns {string} Маскированное значение
   */
  const applyMask = (value: string, mask: string, prefix: string = ''): string => {
    if (!mask) return value

    // Удаляем префикс из значения, если он присутствует
    let valueWithoutPrefix = value
    if (prefix && value.startsWith(prefix)) {
      valueWithoutPrefix = value.slice(prefix.length)
    }

    // Извлекаем только цифры из введенного значения (без префикса)
    const digitsOnly = valueWithoutPrefix.replace(/\D/g, '')

    // Если нет цифр, возвращаем пустую строку
    if (digitsOnly.length === 0) {
      return ''
    }

    // Если есть цифры и префикс, начинаем с префикса
    let maskedValue = prefix

    let digitIndex = 0
    const maskStartIndex = prefix.length // Начинаем применять маску после префикса

    // Применяем маску, начиная с позиции после префикса
    for (let i = maskStartIndex; i < mask.length; i++) {
      const maskChar = mask[i]

      if (maskChar === '#' || maskChar === '9') {
        // Ожидаем цифру
        if (digitIndex < digitsOnly.length) {
          maskedValue += digitsOnly[digitIndex]
          digitIndex++
        } else {
          // Цифры закончились, прекращаем добавление
          break
        }
      } else {
        // Это специальный символ маски (разделитель)
        // Добавляем его если:
        // 1. Это разделитель сразу после префикса (i === maskStartIndex)
        // 2. Или уже есть хотя бы одна введенная цифра
        if (i === maskStartIndex || digitIndex > 0) {
          maskedValue += maskChar
        }
      }
    }

    return maskedValue
  }

  /**
   * Вычисляет длину защищенной области (prefix + разделители сразу после него)
   * Для маски "+99-99-9999-9999" и prefix "+62" вернет 4 ("+62-")
   */
  const getProtectedLength = (mask: string, prefix: string): number => {
    if (!prefix || !mask) return 0

    let pos = prefix.length
    // Пропускаем разделители сразу после префикса
    while (pos < mask.length && mask[pos] !== '#' && mask[pos] !== '9') {
      pos++
    }
    return pos
  }

  // Функция для защиты префикса - корректирует позицию курсора при клике/фокусе
  const ensureCaretAfterPrefix = (protectedLength: number) => {
    if (!inputRef.current || protectedLength === 0) return

    const currentPos = inputRef.current.selectionStart ?? 0

    // Если курсор в защищенной области, переместить его после нее
    if (currentPos < protectedLength) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.setSelectionRange(protectedLength, protectedLength)
        }
      }, 0)
    }
  }

  return { inputRef, applyMask, ensureCaretAfterPrefix, getProtectedLength }
}

export default useInputMask
