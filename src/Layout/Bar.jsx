import React from "react";
import logo from "/public/logo.svg";
import { Button } from "@material-tailwind/react";
import { Link } from "react-router-dom";
import {
  FaProjectDiagram,
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
  const [activeButton, setActiveButton] = React.useState(null);

  const handleButtonClick = (label) => {
    setActiveButton(label);
  };

  return (
    <aside className="flex h-screen w-1/4 flex-col items-center justify-start bg-barbg p-[10px] shadow-lg 2xl:w-[280px]">
      <div className="mb-4 ml-4 mt-3 flex w-full items-center justify-start gap-4">
        <img
          src={logo}
          alt="Logo"
          className="w-[48px] h-[48px] border-[1px] border-border rounded-2xl p-[5px]"
        />
        <h1 className="text-[25px] text-white font-semibold">ARCH LAB</h1>
      </div>
      <div className="flex h-full w-64 flex-col items-start justify-between gap-1 text-white">
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
          { icon: <FaComments />, label: "Chat" },
          { icon: <FaUserFriends />, label: "Foydalanuvchilar" },
          { icon: <FaCog />, label: "Sozlamalar" },
        ].map((button, index) => (
          <Link to={`/${button.label}`} className=" w-full" key={index}>
            <Button
              className={`w-full rounded-xl p-2 shadow-none ${
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
    </aside>
  );
};

const CustomButton = ({ icon, label }) => (
  <div className="flex items-center space-x-2 px-2 py-2 rounded  cursor-pointer">
    <span className="text-lg">{icon}</span>
    <span>{label}</span>
  </div>
);
export default Bar;
