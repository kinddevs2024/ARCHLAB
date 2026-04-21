import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Textarea,
} from "@material-tailwind/react";

const Addzadanie = () => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleOpen = () => setOpen(!open);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/vazifa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });
      if (response.ok) {
        setMessage("");
        setOpen(false);
      } else {
        alert("Failed to send message");
      }
    } catch (error) {
      alert("Error: " + error.message);
    }
    setLoading(false);
  };

  return (
    <>
      <Button onClick={handleOpen} className="rounded-xl bg-borderlog">
        <span>Yangi vazifa berish</span>
      </Button>
      <Dialog open={open} handler={handleOpen} className="rounded-2xl">
        <DialogHeader>Yangi vazifa berish</DialogHeader>
        <DialogBody>
          <Textarea
            className="!border-[1.5px] !border-blue-gray-200/90"
            rows={5}
            placeholder="Vazifani kiriting..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </DialogBody>
        <DialogFooter className="border-t border-[#eef1f7] pt-4">
          <Button
            variant="text"
            color="red"
            onClick={handleOpen}
            className="mr-1"
            disabled={loading}
          >
            <span>Bekor qilish</span>
          </Button>
          <Button
            className="rounded-xl bg-borderlog"
            onClick={handleSubmit}
            disabled={loading || !message.trim()}
          >
            <span>Yuborish</span>
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
};

export default Addzadanie;