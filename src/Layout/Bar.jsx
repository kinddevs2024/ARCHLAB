import React from "react";
import logo from "/public/logo.svg";
import pages from "/public/pages1.svg";
import { Button } from "@material-tailwind/react";

const Bar = () => {
  return (
    <div className="flex bg-barbg flex-col justify-start items-center h-screen  2xl:w-1/5 w-1/4  p-4 shadow-lg">
      <div className="flex gap-4 items-center mb-4 justify-start w-full ml-8 mt-3">
        <img
          src={logo}
          alt="Logo"
          className="w-14 h-14 border-[2px] border-border rounded-2xl p-[3px]"
        />
        <h1 className="text-2xl text-white font-semibold">ARCH LAB</h1>
      </div>
      <div className="flex flex-col gap-3 items-start justify-start w-full h-full mt-3">
        {/* Loyihalar */}
        <Button
          style={{ textTransform: "none" }}
          className="text-lg  shadow-none flex justify-start gap-3 font-thin w-full text-start  bg-barbg hover:bg-btnhover  text-white  cursor-pointer"
        >
          <img src={pages} alt="pages" />
          Loyihalar
        </Button>
        {/* Yakka tartibdagi loyihalar */}
        <Button
          style={{ textTransform: "none" }}
          className="text-lg  shadow-none flex justify-start gap-3 font-thin w-full text-start  bg-barbg hover:bg-btnhover  text-white  cursor-pointer"
        >
          <img src={pages} alt="pages" />
          Yakka tartibdagi loyihalar
        </Button>
        {/* Interyer */}
        <Button
          style={{ textTransform: "none" }}
          className="text-lg  shadow-none flex justify-start gap-3 font-thin w-full text-start  bg-barbg hover:bg-btnhover  text-white  cursor-pointer"
        >
          <img src={pages} alt="pages" />
          Interyer
        </Button>
      </div>
    </div>
  );
};

export default Bar;
