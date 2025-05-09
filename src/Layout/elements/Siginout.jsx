import React from "react";
import {
  Button,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
} from "@material-tailwind/react";
import { FaDoorOpen } from "react-icons/fa";

export function Siginout() {
  const [size, setSize] = React.useState(null);

  const handleOpen = (value) => setSize(value);
  const handleLogout = () => {
    // Clear localStorage
    localStorage.clear();
    // Refresh the window
    window.location.reload();
  };
  return (
    <>
      <div className="mb-3 flex gap-3">
        <Button
          className="bg-[#FFFFFF14] w-full p-2 hover:bg-[#ff2424]"
          onClick={() => handleOpen("xs")}
        >
          <CustomButton
            icon={<FaDoorOpen />}
            label="Выход"
            className="text-lg shadow-none flex justify-start gap-3 font-thin w-full text-start bg-red-600 hover:bg-red-700 text-white cursor-pointer mt-4"
          />
        </Button>
      </div>
      <Dialog open={size === "xs"} size={size || "md"} handler={handleOpen}>
        <DialogHeader>Siz Akauntdan chiqmoqchimisiz ?</DialogHeader>
        <DialogBody>
          <div className="flex flex-col items-center justify-center">
            <p className="text-start text-gray-600">
              Sizning barcha ma'lumotlaringiz o'chiriladi va siz tizimdan
              chiqasiz.
            </p>
          </div>
        </DialogBody>
        <DialogFooter className="gap-2">
          <Button
            variant="text"
            color="black"   
            onClick={() => handleOpen(null)}
            className="mr-1"
          >
            <span>Yo'q</span>
          </Button>
          <Button
            variant="gradient"
            color="red"
            onClick={() => {
                localStorage.clear();
                window.location.href = "/";
              handleOpen(null);
            }}
          >
            <span>Ha</span>
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}

const CustomButton = ({ icon, label }) => (
  <div className="flex items-center space-x-2 px-2 py-2 rounded  cursor-pointer">
    <span className="text-lg">{icon}</span>
    <span>{label}</span>
  </div>
);
export default Siginout;
