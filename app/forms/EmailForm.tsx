'use client'

import type { JSX } from 'react'

import BaseForm from './components/BaseForm'
import EmailIcon from './components/icons/EmailIcon'

const EmailForm = ({ className }: { className?: string }): JSX.Element => {
  return (
    <BaseForm
      className={className}
      formMarker='mail_id'
      formClassName='email-contact w-80'
      icon={<EmailIcon />}
      description={
        <>
          Daftar untuk konsultasi
          <br />
          online gratis
        </>
      }
      submitLabel='Daftar'
      successMessage='Terima kasih! Formulir Anda telah berhasil dikirim.'
    />
  )
}

export default EmailForm
