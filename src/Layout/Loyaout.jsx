import React from "react";
import {} from "react-router-dom";
import Header from "./Header";
import "react-custom-cursors/dist/index.css";
import Bar from "./Bar";

const Loyaout = ({ children }) => {
  return (
    <>
      <div className="flex flex-row justify-between items-center h-screen w-screen ">
        <div className=" fixed top-0 left-0 z-10 w-1/4 h-screen">
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

export default Loyaout;
