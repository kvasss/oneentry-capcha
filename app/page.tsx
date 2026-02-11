import Image from "next/image";
/* eslint-disable @typescript-eslint/no-unused-vars */
import EmailForm from './forms/EmailForm'
import PhoneForm from './forms/PhoneForm'

export default function Home() {
  return (
    <div className='flex gap-8 mx-auto justify-center text-center'>
      <PhoneForm />

      <EmailForm />
    </div>
  );
}
