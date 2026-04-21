import React, { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import getYearsFrom2024ToNow from "../Home/year";
import { Button } from "@material-tailwind/react";
import { GoChevronLeft, GoChevronRight } from "react-icons/go";


export function Hatlar() {
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
    // Simulating backend call
    fetchProjects(year);
  }, [year]);

  const fetchProjects = async () => {
    try {
      // Example: Replace this wip your real API call
      // const response = await axios.get(`/api/projects?year=${selectedYear}`);
      // setProjects(response.data);

      // Temporary MOCK data
      const response = [
        {
          date: "2021-11-03",
          name: "“Iroda va Shukur”MCHJ",
          zakaznemer: "Sadullayev Farhod",
          tel: "+998 99 123 45 67",
          dogmany: "300",
          fileUrl:
            "https://ficvoth030btryaa.public.blob.vercel-storage.com/New%20folder-OMoeW2SB1WOc1UMfjS8QK2LBAiLmk3.zip",
          zipfileUrl:
            "https://ficvoth030btryaa.public.blob.vercel-storage.com/New%20folder-OMoeW2SB1WOc1UMfjS8QK2LBAiLmk3.zip",
        },
        {
          date: "2021-11-03",
          name: "“Iroda va Shukur”MCHJ",
          zakaznemer: "Sadullayev Farhod",
          tel: "+998 99 123 45 67",
          dogmany: "300",
          fileUrl:
            "https://ficvoth030btryaa.public.blob.vercel-storage.com/New%20folder-OMoeW2SB1WOc1UMfjS8QK2LBAiLmk3.zip",
          zipfileUrl:
            "https://ficvoth030btryaa.public.blob.vercel-storage.com/New%20folder-OMoeW2SB1WOc1UMfjS8QK2LBAiLmk3.zip",
        },
        {
          date: "2021-11-03",
          name: "“Iroda va Shukur”MCHJ",
          zakaznemer: "Sadullayev Farhod",
          tel: "+998 99 123 45 67",
          dogmany: "300",
          fileUrl:
            "https://ficvoth030btryaa.public.blob.vercel-storage.com/New%20folder-OMoeW2SB1WOc1UMfjS8QK2LBAiLmk3.zip",
          zipfileUrl:
            "https://ficvoth030btryaa.public.blob.vercel-storage.com/New%20folder-OMoeW2SB1WOc1UMfjS8QK2LBAiLmk3.zip",
        },
        {
          date: "2021-11-03",
          name: "“Iroda va Shukur”MCHJ",
          zakaznemer: "Sadullayev Farhod",
          tel: "+998 99 123 45 67",
          dogmany: "300",
          fileUrl:
            "https://ficvoth030btryaa.public.blob.vercel-storage.com/New%20folder-OMoeW2SB1WOc1UMfjS8QK2LBAiLmk3.zip",
          zipfileUrl:
            "https://ficvoth030btryaa.public.blob.vercel-storage.com/New%20folder-OMoeW2SB1WOc1UMfjS8QK2LBAiLmk3.zip",
        },
      ];
      setProjects(response);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  useEffect(() => {
    const currentYears = getYearsFrom2024ToNow();
    setYear(currentYears[currentYears.length - 1]); // Set default to the last year
  }, []);
  const decrementYears = () => {
    const currentYears = getYearsFrom2024ToNow();
    const currentIndex = currentYears.indexOf(year);
    if (currentIndex > 0) {
      setYear(currentYears[currentIndex - 1]); // Move to the previous year
    } else if (currentIndex === 0) {
      setYear(currentYears[currentYears.length - 1]); // If at index 0, move to the last year
    }
  };

  const incrementYears = () => {
    const currentYears = getYearsFrom2024ToNow();
    const currentIndex = currentYears.indexOf(year);
    if (currentIndex < currentYears.length - 1) {
      setYear(currentYears[currentIndex + 1]); // Move to the next year
    } else if (currentIndex === currentYears.length - 1) {
      setYear(currentYears[0]); // If at the last index, move to the first year
    }
  };

  return (
    <>
      <Analytics />
      <div className="page-shell">
        <div className="panel-header">
          <h1 className="ml-1 text-3xl font-bold">Xatlar</h1>

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
        </div>
        <div className="table-card w-full">
          <div className="overflow-x-auto">
            <div className="min-w-[1150px]">
              <div className="table-head-row grid-cols-[0.5fr_1.6fr_1fr_1.4fr_1fr_1fr_1.6fr]">
                <p>№</p>
                <p>Nomi</p>
                <p>Sana</p>
                <p>Buyurtmachi</p>
                <p>Tel raqam</p>
                <p>Dog summa</p>
                <p>Yuklash</p>
              </div>
              <div>
                {projects.length > 0 ? (
                  projects.map((project, index) => (
                    <div
                      key={index}
                      className="table-data-row grid-cols-[0.5fr_1.6fr_1fr_1.4fr_1fr_1fr_1.6fr]"
                    >
                      <p>{index + 1}</p>
                      <p>{project.name}</p>
                      <p>{project.date}</p>
                      <p>{project.zakaznemer}</p>
                      <p>{project.tel}</p>
                      <p>{project.dogmany}.000</p>
                      <div className="flex items-center gap-2">
                        <p>
                          {project.fileUrl ? (
                            <button
                              onClick={() =>
                                downloadFile(
                                  project.fileUrl,
                                  `${project.object}.zip`
                                )
                              }
                              className="flex items-center justify-center gap-2 rounded-md bg-borderlog px-3 py-2 text-white transition-colors hover:bg-[#b28f67]"
                            >
                              Yuklash
                              <span
                                className={`w-[32px] h-[16px] rounded-[12px] items-center text-[10px] font-extrabold text-center flex justify-center gap-2 bg-[#FFFFFF33] group-hover:bg-[#00000033] ${
                                  "bg-[#FFFFFF33]"
                                  }`}
                              >
                                <p>PDF</p>
                              </span>
                            </button>
                          ) : (
                            "No File"
                          )}
                        </p>
                        <p>
                          {project.zipfileUrl ? (
                            <button
                              onClick={() =>
                                downloadFile(
                                  project.zipfileUrl,
                                  `${project.object}.zip`
                                )
                              }
                              className="flex items-center justify-center gap-2 rounded-md bg-borderlog px-3 py-2 text-white transition-colors hover:bg-[#b28f67]"
                            >
                              Yuklash
                              <span className=" w-[32px] h-[16px] rounded-[12px]  items-center text-[10px] font-extrabold text-center flex justify-center gap-2 bg-[#FFFFFF33]  group-hover:bg-[#00000033]">
                                <p>DOC</p>
                              </span>
                            </button>
                          ) : (
                            "No File"
                          )}
                        </p>
                      </div>
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
export default Hatlar;
