import React from 'react';
import logo from "/public/logo.svg"; 

const Header = () => {
  return (
    <header>
      <div className=' flex items-center justify-between p-4  w-full h-full text-white'>
        <img src={logo} alt="Logo" className="w-12 h-12" />
      </div>
    </header>
  );
};

export default Header;