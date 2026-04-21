import React from "react";
import { FaSearch } from "react-icons/fa";
import { IoNotificationsOutline } from "react-icons/io5";

const Header = () => {
  return (
    <header className="ml-3 flex items-center justify-between border-b border-[#e6e9f0] bg-white px-5 py-3">
      <div className="flex w-[320px] items-center rounded-[12px] border border-[#e6e9f0] px-4 py-1">
        <input
          type="text"
          placeholder="Qidirish"
          className="h-[50px] w-full bg-transparent text-gray-600 outline-none"
        />
        <FaSearch className="text-gray-700 w-6 h-6" />
      </div>

      <div className="flex items-center gap-4">
        <div className="relative rounded-xl p-2 hover:bg-[#f5f6fa]">
          <IoNotificationsOutline className="text-2xl" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
        </div>

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
    </header>
  );
};

export default Header;
