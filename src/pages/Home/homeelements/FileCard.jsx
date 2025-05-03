import React from "react";

const FileCard = ({status, name , infodis , dataspam}) => {
  return (
    <div className="flex items-center justify-between bg-[#d1b08a] rounded-md px-4 py-2 text-white w-full max-w-4xl shadow">
      <div className="flex items-center gap-4">
        <button className="bg-green-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
          {status}
        </button>
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
            />
          </svg>
          <span>{name}</span>
        </div>
        <div className="text-sm text-white">{infodis}</div>
      </div> 
      <div className="flex items-center gap-4">
        <span className="text-sm">{dataspam}</span>
        <button className="bg-white text-gray-800 px-4 py-1 rounded-md text-sm shadow">
          Yuklash
        </button>
      </div>
    </div>
  );
};

export default FileCard;
