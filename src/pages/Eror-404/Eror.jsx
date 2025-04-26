import gsap from 'gsap';
import React, { useLayoutEffect } from 'react'

const Eror = () => {

  return (
    <div className='flex justify-center flex-col Eror items-center'>
      <img className='w-[70%] h-[50%]' src="public/404.svg" alt="404" />
      <p>EROR 404</p>
    </div>
  )
}

export default Eror;