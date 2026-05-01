'use client'

import type { JSX } from 'react'

import BaseForm from './components/BaseForm'
import PhoneIcon from './components/icons/PhoneIcon'

const PhoneForm = ({ className }: { className?: string }): JSX.Element => {
  return (
    <BaseForm
      className={className}
      formMarker='call_id'
      formClassName='phone-contact w-80'
      icon={<PhoneIcon />}
      description={
        <>
          Tinggalkan nomor telepon Anda
          <br />
          untuk dihubungi kembali oleh manajer kami
        </>
      }
      submitLabel='Kirim permintaan'
      successMessage='Terima kasih! Permintaan Anda telah dikirim. Manajer kami akan segera menghubungi Anda.'
    />
  )
}

export default PhoneForm
