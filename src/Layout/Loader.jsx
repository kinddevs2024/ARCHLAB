import React from "react";
import logo from "/public/logo.svg";
import building from "/public/building.png";
import Loginbg from "/public/Loginbg.png";

const Loader = () => {
  function myGreeti() {
    document.getElementById("id").classList.add("hidden");
  }
  return (
    <div
      id="id"
      className="flex justify-center items-center w-screen h-screen bg-white fixed top-0 left-0 z-50"
    >
      <div class="grid grid-cols-1 md:grid-cols-2 w-full bg-[url(/public/Loginbg.png)] bg-no-repeat bg-bottom  object-bottom max-w-6xl shadow-lg rounded-2xl overflow-hidden bg-white">
        <div class="p-10 flex flex-col justify-center">
          <div class="flex gap-[26px] justify-center items-center mb-10">
            <img src={logo} alt="Logo" class="h-10" />
            <h1 class="text-2xl font-bold text-textcolor">
              ARCH LAB WOORKROOM
            </h1>
          </div>
          <div className="flex flex-col items-center justify-center h-full">
            <h2 class="text-xl font-semibold mb-6">Xush kelibsiz</h2>

            <form class="space-y-4">
              <div class="flex items-center border border-gray-300 rounded px-3 py-2">
                <svg
                  class="w-5 h-5 text-gray-500 mr-2"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M16 12l-4-4-4 4m8 0v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6m16-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v4"></path>
                </svg>
                <input
                  type="email"
                  placeholder="Email"
                  class="w-full border-none focus:outline-none focus:ring-0"
                />
              </div>

              <div class="flex items-center border border-gray-300 rounded px-3 py-2">
                <svg
                  class="w-5 h-5 text-gray-500 mr-2"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm6-6a2 2 0 100-4 2 2 0 000 4z"></path>
                </svg>
                <input
                  type="password"
                  placeholder="Password"
                  class="w-full border-none focus:outline-none focus:ring-0"
                />
              </div>

              <div class="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="remember"
                  class="w-4 h-4 text-blue-600"
                  checked
                />
                <label for="remember" class="text-sm">
                  Eslab qolish
                </label>
              </div>

              <button
                type="submit"
                class="w-full bg-[#c2a37a] hover:bg-[#a98a64] text-white font-semibold py-2 rounded"
              >
                Kirish
              </button>
            </form>
          </div>
        </div>

        <div class="hidden md:block">
          <img
            src={building}
            alt="Building"
            class="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
};
export default Loader;
