import React from "react";
import { FaBars, FaSearch } from "react-icons/fa";
import { IoNotificationsOutline } from "react-icons/io5";
import ThemeToggle from "./elements/ThemeToggle";

const Header = () => {
  return (
    <div className="flex items-center justify-between px-5  ml-3  py-3    border-b bg-white">
      {/* Left side: Menu icon */}


      {/* Center: Search box */}
      <div className="flex items-center border rounded-[12px] px-4 py-1 w-[300px]">
        <input
          type="text"
          placeholder="Qidirish"
          className="outline-none w-[350px] h-[50px]  text-gray-600"
        />
        <FaSearch className="text-gray-700 w-6 h-6" />
      </div>

      {/* Right side: Notification and user */}
      <div className="flex items-center gap-4">
        {/* Notification bell */}
        <div className="relative">
          <IoNotificationsOutline className="text-2xl" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
        </div>

        {/* User info */}
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="font-semibold">Kamoliddin Sulaymanov</div>
            <div className="text-sm text-gray-500">Asosiy arxitektor</div>
          </div>
          <img
            src="https://i.pravatar.cc/40" // Replace with real avatar
            alt="avatar"
            className="w-10 h-10 rounded-full"
          />
        </div>
      </div>
    </div>
  );
};

export default Header;
