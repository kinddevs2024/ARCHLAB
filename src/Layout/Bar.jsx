import React from "react";
import logo from "/public/logo.svg";
import { Button, Button as MaterialButton } from "@material-tailwind/react";
import { Link } from "react-router-dom";
import {
  FaProjectDiagram,
  FaDoorOpen,
  FaUserFriends,
  FaComments,
  FaCog,
  FaFileAlt,
  FaEnvelope,
  FaClipboardList,
  FaFlask,
  FaSearch,
  FaLayerGroup,
} from "react-icons/fa";
import Siginout from "./elements/Siginout";

const Bar = () => {
  const handleLogout = () => {
    // Clear localStorage
    localStorage.clear();
    // Refresh the window
    window.location.reload();
  };

  const [activeButton, setActiveButton] = React.useState(null);

  const handleButtonClick = (label) => {
    setActiveButton(label);
  };

  return (
    <div className="flex bg-barbg flex-col justify-start items-center h-screen 2xl:w-[280px] w-1/4 p-[10px] shadow-lg">
      <div className="flex gap-4 items-center mb-4 justify-start w-full ml-8 mt-3">
        <img
          src={logo}
          alt="Logo"
          className="w-[48px] h-[48px] border-[1px] border-border rounded-2xl p-[5px]"
        />
        <h1 className="text-[25px] text-white font-semibold">ARCH LAB</h1>
      </div>
      <div className="gap-1 text-white w-64 flex flex-col justify-between items-start h-full">
        {[
          { icon: <FaProjectDiagram />, label: "Loihalar" },
          { icon: <FaLayerGroup />, label: "Yakka tartibdagi loyihalar" },
          { icon: <FaLayerGroup />, label: "Interyer" },
          { icon: <FaFileAlt />, label: "Tex-obs" },
          { icon: <FaFlask />, label: "Laboratoriya" },
          { icon: <FaSearch />, label: "Tashqi nazorat" },
          { icon: <FaFileAlt />, label: "Rendr" },
          { icon: <FaClipboardList />, label: "Shartnomalar" },
          { icon: <FaEnvelope />, label: "Xatlar" },
          { icon: <FaClipboardList />, label: "Buyruqlar" },
          { icon: <FaUserFriends />, label: "Foydalanuvchilar" },
          { icon: <FaCog />, label: "Sozlamalar" },
        ].map((button, index) => (
          <Link to={`/${button.label}`} className=" w-full" key={index}>
            <Button
              className={`p-2 w-full shadow-none ${
                button.label === activeButton
                  ? "bg-[#FAF8F21A] text-borderlog"
                  : "bg-[#282D32] hover:bg-[#343A40] "
              }`}
              onClick={() => handleButtonClick(button.label)}
            >
              <CustomButton icon={button.icon} label={button.label} />
            </Button>
          </Link>
        ))}
        <div className="mt-auto w-full">
          <Siginout />
        </div>
      </div>
    </div>
  );
};

const CustomButton = ({ icon, label }) => (
  <div className="flex items-center space-x-2 px-2 py-2 rounded  cursor-pointer">
    <span className="text-lg">{icon}</span>
    <span>{label}</span>
  </div>
);
export default Bar;
