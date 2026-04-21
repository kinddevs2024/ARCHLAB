import React, { useEffect, useState } from "react";
import axios from "axios";
import getYearsFrom2024ToNow from "./year.js";
import { Button } from "@material-tailwind/react";
import { GoChevronLeft, GoChevronRight } from "react-icons/go";
import { Addproject } from "./homeelements/Addproject.jsx";
import Info from "./homeelements/Info.jsx";
import AvatarUploadPage from "./homeelements/AvatarUploadPage.jsx";

export function Home() {
  const [projects, setProjects] = useState([]);
  const [year, setYear] = useState(2021);

  const downloadFile = async (fileUrl, fileName) => {
    try {
      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = fileName || "file";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Ошибка при скачивании файла:", error);
    }
  };

  useEffect(() => {
    fetchProjects(year);
  }, [year]);

  const fetchProjects = async (selectedYear) => {
    try {
      const response = await axios.get(
        `http://localhost:3005/api/projects?year=${selectedYear}`
      );
      setProjects(response.data);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  useEffect(() => {
    const currentYears = getYearsFrom2024ToNow();
    setYear(currentYears[currentYears.length - 1]);
  }, []);

  const decrementYears = () => {
    const currentYears = getYearsFrom2024ToNow();
    const currentIndex = currentYears.indexOf(year);
    if (currentIndex > 0) {
      setYear(currentYears[currentIndex - 1]);
    } else if (currentIndex === 0) {
      setYear(currentYears[currentYears.length - 1]);
    }
  };

  const incrementYears = () => {
    const currentYears = getYearsFrom2024ToNow();
    const currentIndex = currentYears.indexOf(year);
    if (currentIndex < currentYears.length - 1) {
      setYear(currentYears[currentIndex + 1]);
    } else if (currentIndex === currentYears.length - 1) {
      setYear(currentYears[0]);
    }
  };

  const statusceker = (status) => {
    if (status === "1") {
      return { label: "Tayyorlandi", color: "bg-[#4CAE4C]" };
    } else if (status === "2") {
      return { label: "Jarayonda", color: "bg-[#F0AD4E]" };
    } else {
      return { label: "Boshqa", color: "bg-blue-500" };
    }
  };

  return (
    <>
      <div className="page-shell">
        <div className="panel-header">
          <h1 className="ml-1 text-3xl font-bold">Loyihalar</h1>
          <AvatarUploadPage />
          <div className="card-surface flex h-[49px] items-center justify-center space-x-2 p-2 pl-3 pr-3">
            <Button
              onClick={decrementYears}
              className="px-[0px] py-[0px] w-[32px] h-[32px] text-black shadow-none bg-[#F1F1F1] duration-300 rounded-xl"
            >
              <GoChevronLeft className="w-[32px] h-[32px]" />
            </Button>
            <div className="flex items-center space-x-2">
              <div className="flex gap-3 ">
                {getYearsFrom2024ToNow().map((yr) => (
                  <Button
                    key={yr}
                    onClick={() => setYear(yr)}
                    className={`px-4 z- font-bold py-2 w-[64px] h-[33px] duration-300 shadow-none rounded-xl ${
                      year === yr
                        ? "bg-borderlog text-white"
                        : "bg-[#F1F1F1] text-black"
                    }`}
                  >
                    {yr}
                  </Button>
                ))}
              </div>
            </div>
            <Button
              onClick={incrementYears}
              className="px-[0px] py-[0px] w-[32px] h-[32px] text-black shadow-none bg-[#F1F1F1] duration-300 rounded-xl"
            >
              <GoChevronRight className="w-[32px] h-[32px]" />
            </Button>
          </div>
          <Addproject />
        </div>

        <div className="table-card w-full">
          <div className="overflow-x-auto">
            <div className="min-w-[1000px]">
              <div className="table-head-row grid-cols-[2.4fr_1.2fr_1.2fr_0.9fr_0.9fr_0.9fr]">
                <p>Kompaniya nomi</p>
                <p>Obyekt nomi</p>
                <p>Obyekt joyi</p>
                <p>Status</p>
                <p>Sana</p>
                <p>Yuklash</p>
              </div>
              <div>
                {projects.length > 0 ? (
                  projects.map((project, index) => (
                    <div
                      key={index}
                      className="table-data-row grid-cols-[2.4fr_1.2fr_1.2fr_0.9fr_0.9fr_0.9fr]"
                    >
                      <div className="py-1">
                        <div className="flex items-center justify-start gap-3">
                          <Info reponse={project} />
                          <div className="flex  items-center  gap-3">
                            {project.company}
                          </div>
                        </div>
                      </div>
                      <p>{project.client}</p>
                      <p>{project.assistant}</p>
                      <p>
                        <span
                          className={`rounded-[12px] px-3 py-1 text-xs font-semibold text-white ${
                            statusceker(project.status).color
                          }`}
                        >
                          {statusceker(project.status).label}
                        </span>
                      </p>
                      <p>
                        {project.date
                          ? new Date(project.date).getFullYear()
                          : ""}
                      </p>
                      <p>
                        {project.fileUrl ? (
                          <button
                            onClick={() =>
                              downloadFile(
                                project.fileUrl,
                                `${project.object}.zip`
                              )
                            }
                            className="rounded-md bg-borderlog px-4 py-2 text-white transition-colors hover:bg-[#b28f67]"
                          >
                            Yuklash
                          </button>
                        ) : (
                          "No File"
                        )}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center">
                    <p colSpan="5" className="text-center py-4">
                      No projects found.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
export default Home;
