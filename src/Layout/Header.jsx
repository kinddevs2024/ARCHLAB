import React from 'react';
import logo from "/public/logo.svg"; 

const Header = () => {
  return (
    <header>
      <div>
        <img src={logo} alt="Logo" className="w-12 h-12" />
      </div>
    </header>
  );
};

export default Header;