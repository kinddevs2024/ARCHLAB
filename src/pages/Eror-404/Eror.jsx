import gsap from 'gsap';
import React, { useLayoutEffect } from 'react'

const Eror = () => {
  useLayoutEffect(() => {
    const tl = gsap.timeline();
    tl.fromTo('.Eror', { opacity: 0 }, { opacity: 1, duration: 1 });
    tl.fromTo('.Eror img', { y: -50 }, { y: 0, duration: 1 });
  }, []);
  return (
    <div className='flex  justify-center flex-col Eror items-center'>
      <img className='w-[70%] h-[40%]' src="public/404.svg" alt="404" />
    </div>
  )
}

export default Eror;