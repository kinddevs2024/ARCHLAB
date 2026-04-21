import React, { useState, useEffect } from "react";
import Header from "./Header";
import "react-custom-cursors/dist/index.css";
import Bar from "./Bar";
import Eror from "/public/401Eror.svg";

const Layout = ({ children }) => {
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth <= 1100);
    };

    handleResize(); // Check on initial render
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  if (isSmallScreen) {
    return (
      <div className="flex items-center justify-center flex-col h-screen bg-border">
          <img className=" w-2/5" src={Eror} alt="Eror" />
        <div className="text-center p-4 rounded-lg bg-white shadow-lg">
          <p className="text-red-600 font-bold">
            Uzur, hozircha saytni Telefon varianti YO'Q. Iltimos, Kompyuter yoki
            Planshettan oching.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-screen w-screen flex-row items-center justify-between bg-[#f6f8fd]">
        <div className=" fixed top-0 left-0 z-10 2xl:w-1/4 w-[1000px] h-screen">
          <Bar />
        </div>
        <div className="flex bg-barbg flex-col justify-start items-center h-screen 2xl:w-[280px] w-1/4 m-[20px] shadow-lg"></div>

        <div className="flex flex-col  w-full h-screen ">
          <Header />
          <div className="container flex justify-between w-full h-full p-0 flex-col mx-auto ">
            {children}
          </div>
        </div>
      </div>
    </>
  );
};

export default Layout;
