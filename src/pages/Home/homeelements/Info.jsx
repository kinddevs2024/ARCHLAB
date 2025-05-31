import React from "react";
import { BsInfoCircleFill } from "react-icons/bs";
import {
  Button,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Typography,
} from "@material-tailwind/react";

// Fix: Rename the exported component to match the default export (Info)
export function Info({reponse}) {
  // State to manage the open/close state of the dialog
  const [open, setOpen] = React.useState(false);

  const handleOpen = () => setOpen(!open);

  return (
    <>
      <Button
        className=" m-0 p-0 bg-transparent rounded-full"
        onClick={handleOpen}
      >
        <BsInfoCircleFill className="w-8 h-8 text-borderlog group-hover:text-white" />
      </Button>
      <Dialog open={open} handler={handleOpen}>
        <DialogHeader>Loyiha haqila to'liq malumot</DialogHeader>
        <DialogBody className="h-[42rem] overflow-scroll">
          <Typography className="font-normal">
            <p>Loyiha egasi / egalari : {reponse.client}</p>
            <p>Firma nomi : {reponse.assistant}</p>
            <p>Obect nomi : {reponse.master}</p>
            <p>Obect nomi : {reponse.project}</p>
            <p>Loiha statusi : {reponse.project}</p>
            <p>Loiha haqida qo'shimcha malumot : {reponse.description}</p>
          </Typography>
        </DialogBody>
        <DialogFooter className="space-x-2">
          <Button variant="text" color="blue-gray" onClick={handleOpen}>
            cancel
          </Button>
          <Button variant="gradient" color="green" onClick={handleOpen}>
            confirm
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}

export default Info;