import React, { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import getYearsFrom2024ToNow from "../Home/year";
import { Button } from "@material-tailwind/react";
import { GoChevronLeft, GoChevronRight } from "react-icons/go";


export function Hatlar() {
  const [projects, setProjects] = useState([]);
  const [year, setYear] = useState(2021);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [statuscolor, setStatuscolor] = useState(null);


  useEffect(() => {
    setStatuscolor(document.getElementById("statusicon"));
  }, []);

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

  const [activeButton, setActiveButton] = React.useState(null);

  const handleButtonClick = (label) => {
    setActiveButton(label);
  };

  return (
    <>
      <Analytics />
      <div className="flex flex-col bg-[#f6f8fd] justify-start m-0 p-0 items-start w-full bg-bg">
        <div className="flex w-full items-center justify-between mb-6 mt-6">
          <h1 className="text-3xl font-bold ml-4">Xatlar</h1>

          <div className="flex justify-center bg-white p-2 pr-3 pl-3 rounded-xl h-[49px] items-center space-x-2">
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
        <div className="w-full flex justify-center items-center">
          <div className="w-full rounded-lg overflow-hidden">
            <div className="text-[#3A3A49] text-left text-sm">
              <div className="flex items-center justify-between mr-[15px] ml-[15px]">
                <p className="py-3 p">№</p>
                <p className="py-3 px-4 ">Nomi</p>
                <div className="flex items-center pr-12 justify-center">
                  <p className="py-3 px-1 ">Sana</p>
                  <div className="space-y-[2px]">
                    <div className="w-0 h-0 border-b-[5px] border-[#C6A47E] rounded-2xl border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent"></div>
                    <div className="w-0 h-0 border-t-[5px] border-[#ADC0F8] rounded-2xl border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent"></div>
                  </div>
                </div>
                <p className="py-3 px-4  ml-4">Buyurtmachi ismi</p>
                <div className="flex items-center pr-[52px] justify-center gap-[58px]">
                  <p className="py-3 px-4 ">Tel raqam</p>
                  <p className="py-3 px-4 ">Dog summa</p>
                </div>
                <div className="flex items-center justify-evenly space-x-2">
                  <p className="py-3 px-4 ml-14">Yuklash</p>
                </div>
              </div>
            </div>
            <div>
              <div className="  overflow-x-auto gap-3 text-sm">
                {projects.length > 0 ? (
                  projects.map((project, index) => (
                    <div
                      key={index}
                      className="flex space-x-11 justify-between pr-[15px] pl-[15px] items-center rounded-lg group hover:bg-borderlog text-[#333333] hover:text-white"
                    >
                      <p className="py-3 px-[0px]">{index + 1}</p>
                      <p className="py-3 px-[0px]">{project.name}</p>
                      <p className="py-3 px-[0px]">{project.date}</p>
                      <p className="py-3 px-[0px]">{project.zakaznemer}</p>
                      <p className="py-3 px-[0px]">{project.tel}</p>
                      <p className="py-3 px-[0px]">{project.dogmany}.000</p>
                      <div className="flex items-center justify-evenly space-x-2">
                        <p className="py-3 px-[0px]">
                          {project.fileUrl ? (
                            <button
                              onClick={() =>
                                downloadFile(
                                  project.fileUrl,
                                  `${project.object}.zip`
                                )
                              }
                              className="bg-borderlog flex justify-center items-center gap-2  text-white px-3 py-2 rounded-md group-hover:bg-white group-hover:text-black"
                            >
                              Yuklash
                              <button
                                className={`w-[32px] h-[16px] rounded-[12px] items-center text-[10px] font-extrabold text-center flex justify-center gap-2 bg-[#FFFFFF33] group-hover:bg-[#00000033] ${
                                  isClicked ? "bg-[#00000033]" : "bg-[#FFFFFF33]"
                                  }`}
                              >
                                <p>PDF</p>
                              </button>
                            </button>
                          ) : (
                            "No File"
                          )}
                        </p>
                        <p className="py-3 px-[0px]">
                          {project.zipfileUrl ? (
                            <button
                              onClick={() =>
                                downloadFile(
                                  project.zipfileUrl,
                                  `${project.object}.zip`
                                )
                              }
                              className="bg-borderlog flex items-center justify-center gap-2 text-white px-3 py-2 rounded-md group-hover:bg-white group-hover:text-black"
                            >
                              Yuklash
                              <button className=" w-[32px] h-[16px] rounded-[12px]  items-center text-[10px] font-extrabold text-center flex justify-center gap-2 bg-[#FFFFFF33]  group-hover:bg-[#00000033]">
                                <p>DOC</p>
                              </button>
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
