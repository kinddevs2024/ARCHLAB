import React, { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import getYearsFrom2024ToNow from "./year.js";
import downloadFile from "./homeelements/Dowlord.js";

const statusColors = {
  Tayyorlandi: "bg-green-500",
  Jarayonda: "bg-orange-400",
};

export function Home() {
  const [projects, setProjects] = useState([]);
  const [year, setYear] = useState(2021);
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadFile = async (fileUrl, fileName) => {
    try {
      setIsDownloading(true); // старт загрузки

      // Создание ссылки для скачивания
      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = fileName || "file";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => setIsDownloading(false), 1000); // небольшая задержка для красоты
    } catch (error) {
      console.error("Ошибка при скачивании файла:", error);
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    // Simulating backend call
    fetchProjects(year);
  }, [year]);

  const fetchProjects = async (selectedYear) => {
    try {
      // Example: Replace this with your real API call
      // const response = await axios.get(`/api/projects?year=${selectedYear}`);
      // setProjects(response.data);

      // Temporary MOCK data
      const response = [
        {
          status: "Jarayonda",
          company: "Sevimli kanal binosi",
          object: "Sevimli kanal binosining interyer dizayni",
          address: "I.Karimov k. 106-uy",
          date: "2021-11-03",
          fileUrl:
            "https://ficvoth030btryaa.public.blob.vercel-storage.com/New%20folder-OMoeW2SB1WOc1UMfjS8QK2LBAiLmk3.zip",
        },
        {
          status: "Jarayonda",
          company: "Sevimli kanal binosi",
          object: "Sevimli kanal binosining interyer dizayni",
          address: "I.Karimov k. 106-uy",
          date: "2021-11-03",
        },
        {
          status: "Jarayonda",
          company: "Sevimli kanal binosi",
          object: "Sevimli kanal binosining interyer dizayni",
          address: "I.Karimov k. 106-uy",
          date: "2021-11-03",
        },
        {
          status: "Jarayonda",
          company: "Sevimli kanal binosi",
          object: "Sevimli kanal binosining interyer dizayni",
          address: "I.Karimov k. 106-uy",
          date: "2021-11-03",
        },
      ];
      setProjects(response);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };
  return (
    <>
      <div className="flex flex-col bg-[#f6f8fd] justify-start items-start h-screen w-full bg-bg">
        <div className=" text-black">
          <div className="flex items-center  justify-between mb-6 mt-6">
            <h1 className="text-3xl font-bold">Loyihalar</h1>

            <div className="flex justify-center items-center space-x-2 ">
              {getYearsFrom2024ToNow().map((yr) => (
                <button
                  key={yr}
                  onClick={() => setYear(yr)}
                  className={`px-4 py-2 rounded-full ${
                    year === yr ? "bg-white text-black" : "bg-gray-700"
                  }`}
                >
                  {yr}
                </button>
              ))}
            </div>

            <button className="bg-orange-300 hover:bg-orange-400 text-black font-semibold py-2 px-4 rounded-lg">
              Yangi loyiha
            </button>
          </div>

          <div className="">
            <table className="min-w-full bg-white rounded-lg overflow-hidden">
              <thead className="bg-gray-100 text-gray-700 text-left text-sm">
                <tr>
                  <th className="py-3 px-4">Kompaniya nomi</th>
                  <th className="py-3 px-4">Obyekt nomi</th>
                  <th className="py-3 px-4">Obyekt joyi</th>
                  <th className="py-3 px-4">Sana</th>
                  <th className="py-3 px-4">Yuklash</th>
                </tr>
              </thead>
              <tbody>
                {projects.length > 0 ? (
                  projects.map((project, index) => (
                    <tr
                      key={index}
                      className={`border-b ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      <td className="py-3 px-4 flex items-center space-x-2">
                        <span
                          className={`text-black text-xs font-semibold py-1 px-3 rounded-full ${
                            statusColors[project.status]
                          }`}
                        >
                          {project.status}
                        </span>
                        <span className="flex items-center space-x-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 7v10c0 1.1.9 2 2 2h14a2 2 0 002-2V7H3z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 3H8a2 2 0 00-2 2v2h12V5a2 2 0 00-2-2z"
                            />
                          </svg>
                          <span className="text-gray-800">
                            {project.company}
                          </span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-800">
                        {project.object}
                      </td>
                      <td className="py-3 px-4 text-gray-800">
                        {project.address}
                      </td>
                      <td className="py-3 px-4 text-gray-800">
                        {project.date}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() =>
                            downloadFile(
                              project.fileUrl,
                              `${project.company}.zip`
                            )
                          }
                          className="bg-orange-300 hover:bg-orange-400 text-black font-semibold py-1 px-4 rounded"
                          disabled={isDownloading}
                        >
                          {isDownloading ? "Yuklanmoqda..." : "Yuklash"}
                        </button> 
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      className="py-6 px-4 text-center text-gray-500"
                      colSpan="5"
                    >
                      Loyihalar topilmadi
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <Analytics />
    </>
  );
}

export default Home;
