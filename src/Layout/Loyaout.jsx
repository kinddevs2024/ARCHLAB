import React from "react";
import {} from "react-router-dom";
import Header from "./Header";
import "react-custom-cursors/dist/index.css";
import Bar from "./bar";

const Loyaout = ({ children }) => {
  return (
    <>
      <div className="flex flex-row justify-between items-center h-screen w-screen ">
        <Bar />
        <div className="container flex justify-between w-full h-full flex-col mx-auto px-4 py-4">
          <Header />
          {children}
        </div>
      </div>
    </>
  );
};

export default Loyaout;
