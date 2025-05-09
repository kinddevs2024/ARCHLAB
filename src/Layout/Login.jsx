import React, { useState, useEffect } from "react";
import axios from "axios";
import logo from "/public/logo.svg";
import building from "/public/building.png";
import { IoMail } from "react-icons/io5";
import { HiLockClosed } from "react-icons/hi2";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(true); // Track remember me checkbox state
  //
  const myGreeting = () => {
    const element = document.getElementById("id");
    if (element) {
      element.classList.add("hidden");
    }
  };
  
  useEffect(() => {
    if (localStorage.getItem("mail") && localStorage.getItem("password")) {
      console.log("mmmmm");
      myGreeting();
    } else {
      const isLoggedIn = localStorage.getItem("isLoggedIn");
      if (isLoggedIn === "true") {
        myGreeting();
      }
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    let response;
    try {
      response = await axios.post(
        "http://localhost:3005/api/login", // Ensure this URL is correct
        {
          email,
          password,
        }
      );
      console.log(response.data); // Debugging log
    } catch (error) {
      if (error.response && error.response.data.message) {
        setError(error.response.data.message);
      } else {
        setError("An error occurred during login.");
      }
      return; // Exit the function if an error occurs
    }

    const { status, user } = response.data; // Ensure response contains these fields
    if (response.status === 200 && user) {
      const { name, surname, phone, address, username } = user; // Destructure user details
      if (rememberMe) {
        myGreeting();
        localStorage.setItem("mail", email);
        localStorage.setItem("password", password);
        localStorage.setItem("status", status);
        localStorage.setItem("name", name);
        localStorage.setItem("surname", surname);
        localStorage.setItem("phone", phone);
        localStorage.setItem("address", address);
        localStorage.setItem("username", username);
      }
      myGreeting();
    } else {
      setError("Failed to verify email and password.");
    }

    if ( response.status === 200 && response.data.user) {
      if (rememberMe) {
        myGreeting();
        localStorage.setItem("mail", email);
        localStorage.setItem("password", password);
        localStorage.setItem("status", status);
        localStorage.setItem("name", name);
        localStorage.setItem("surname", surname); 
        localStorage.setItem("phone", phone);
        localStorage.setItem("address", address);
        localStorage.setItem("username", username);
      }
      myGreeting();
    } else {
      setError("Failed to verify email and password.");
    }

    // if (!email || !password) {
    //   setError("Email and password are required");
    //   return;
    // } else {
    //   myGreeting();
    //   localStorage.setItem("mail", email);
    //   localStorage.setItem("password", password);
    //   localStorage.setItem("status", status);
    //   localStorage.setItem("name", name);
    //   localStorage.setItem("surname", surname);
    //   localStorage.setItem("phone", phone);
    //   localStorage.setItem("address", address);
    //   localStorage.setItem("username", username);
    //   console.log(localStorage.getItem("mail"));
    //   console.log(localStorage.getItem("password"));
    //   console.log(localStorage.getItem("status"));
    //   console.log(localStorage.getItem("name"));
    //   console.log(localStorage.getItem("surname"));
    //   console.log(localStorage.getItem("phone"));
    //   console.log(localStorage.getItem("address"));
    //   console.log(localStorage.getItem("username"));
    // }

  };

  return (
    <div
      id="id"
      className="flex justify-center  w-screen h-screen bg-white fixed top-0 left-0 z-50"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 w-full bg-[url(/public/Loginbg.png)] bg-no-repeat bg-bottom object-bottom max-w-6xl shadow-lg rounded-2xl overflow-hidden bg-white">
        <div className="p-10 flex flex-col justify-center">
          <div className="flex gap-[26px] justify-center items-center mb-10">
            <img src={logo} alt="Logo" className="h-10" />
            <h1 className="text-2xl font-bold text-textcolor">
              ARCH LAB WOORKROOM
            </h1>
          </div>
          <div className="flex flex-col items-center justify-center h-full">
            <h2 className="text-xl font-semibold mb-6">Xush kelibsiz</h2>

            <form
              className="space-y-4 gap-[29px]"
              onSubmit={(e) => handleSubmit(e)}
            >
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex items-center border border-gray-300 rounded-[10px]  ">
                <div
                  className="w-[40px] h-[40px] text-white bg-borderlog mr-2 p-3 rounded-[9px] rounded-e-none "
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <IoMail />
                </div>
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full border-none focus:outline-none focus:ring-0"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="flex items-center border border-gray-300 rounded-[10px] ">
                <div
                  className="w-[40px] h-[40px] text-white bg-borderlog mr-2 p-3 rounded-[9px] rounded-e-none "
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <HiLockClosed />
                </div>
                <input
                  type="password"
                  placeholder="Password"
                  className="w-[90%] border-none focus:outline-none focus:ring-0"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autocomplete="current-password"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="remember"
                  className="w-4 h-4 text-blue-600"
                  checked={rememberMe} // Bind state to checkbox
                  onChange={(e) => setRememberMe(e.target.checked)} // Update state on change
                />
                <label htmlFor="remember" className="text-sm">
                  Eslab qolish
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-[#c2a37a] hover:bg-[#a98a64] text-white font-semibold py-2 rounded-[10px]"
              >
                Kirish
              </button>
            </form>
          </div>
        </div>

        <div className="hidden md:block">
          <img
            src={building}
            alt="Building"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
};
// Ensure to replace the URL with your actual backend URL

export default Login;
