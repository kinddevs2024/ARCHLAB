import React from "react";

const AvatarUploadPage = () => {
  const fullName = `${localStorage.getItem("name") || ""} ${
    localStorage.getItem("surname") || ""
  }`.trim();
  const role = localStorage.getItem("status") || "Foydalanuvchi";
  const avatar = localStorage.getItem("avatar") || "https://i.pravatar.cc/40";

  return (
    <div className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 shadow-sm">
      <div className="text-right leading-tight">
        <p className="text-sm font-semibold text-[#1f2937]">
          {fullName || "ARCH LAB foydalanuvchisi"}
        </p>
        <p className="text-xs text-[#6b7280]">{role}</p>
      </div>
      <img src={avatar} alt="User avatar" className="h-10 w-10 rounded-full" />
    </div>
  );
};

export default AvatarUploadPage;
