import React, { useState } from "react";
import axios from "axios";
import {
  Input,
  Option,
  Select,
  Button,
  Dialog,
  Textarea,
  IconButton,
  Typography,
  DialogBody,
  DialogHeader,
  DialogFooter,
} from "@material-tailwind/react";
import { XMarkIcon } from "@heroicons/react/24/outline";

export function Addproject() {
  const [open, setOpen] = useState(false);
  const [client, setClient] = useState("");
  const [assistant, setAssistant] = useState("");
  const [master, setMaster] = useState("");
  const [project, setProject] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleOpen = () => setOpen(!open);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const date = new Date().toISOString(); // current date and time
      const response = await axios.post("http://localhost:3005/api/projects", {
        client,
        assistant,
        master,
        project,
        description,
        status,
        date, // <-- add this line
      });
      setOpen(false);
    } catch (error) {
      console.log(error);
      alert("Tarmoqda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={handleOpen} className=" bg-border">
        Yangi loyiha
      </Button>
      <Dialog size="sm" open={open} handler={handleOpen} className="p-4">
        <DialogHeader className="relative m-0 block">
          <Typography variant="h4" color="blue-gray">
            Loyiha yaratish{" "}
          </Typography>
          <IconButton
            size="sm"
            variant="text"
            className="!absolute right-3.5 top-3.5"
            onClick={handleOpen}
          >
            <XMarkIcon className="h-4 w-4 stroke-2" />
          </IconButton>
        </DialogHeader>
        <DialogBody className="space-y-4 pb-6">
          <div>
            <Typography
              variant="small"
              color="blue-gray"
              className="mb-2 text-left font-medium"
            >
              Mijoz ismi
            </Typography>
            <Input
              color="gray"
              size="lg"
              name="client"
              value={client}
              onChange={(e) => setClient(e.target.value)}
              className="placeholder:opacity-100 focus:!border-t-gray-900"
              containerProps={{
                className: "!min-w-full",
              }}
              labelProps={{
                className: "hidden",
              }}
            />
          </div>
          {/* qoshimcha isim */}
          <div>
            <Typography
              variant="small"
              color="blue-gray"
              className="mb-2 text-left font-medium"
            >
              Yordamchi ismi
            </Typography>
            <Input
              color="gray"
              size="lg"
              name="assistant"
              value={assistant}
              onChange={(e) => setAssistant(e.target.value)}
              className="placeholder:opacity-100 focus:!border-t-gray-900"
              containerProps={{
                className: "!min-w-full",
              }}
              labelProps={{
                className: "hidden",
              }}
            />
          </div>
          {/* usta ismi  */}
          <div>
            <Typography
              variant="small"
              color="blue-gray"
              className="mb-2 text-left font-medium"
            >
              Ustaning ismi{" "}
            </Typography>
            <Input
              color="gray"
              size="lg"
              name="master"
              value={master}
              onChange={(e) => setMaster(e.target.value)}
              className="placeholder:opacity-100 focus:!border-t-gray-900"
              containerProps={{
                className: "!min-w-full",
              }}
              labelProps={{
                className: "hidden",
              }}
            />
          </div>
          {/* loyiha statusi  */}

          <div>
            <Typography
              variant="small"
              color="blue-gray"
              className="mb-2 text-left font-medium"
            >
              Loyiha statusi
            </Typography>

            <Select
              className="!w-full !border-[1.5px] !border-blue-gray-200/90 !border-t-blue-gray-200/90 bg-white text-gray-800 ring-4 ring-transparent placeholder:text-gray-600 focus:!border-primary focus:!border-t-blue-gray-900 group-hover:!border-primary"
              placeholder="1"
              labelProps={{
                className: "hidden",
              }}
              value={status}
              onChange={setStatus}
            >
              <Option value="Clothing">Hali boshlammadi</Option>
              <Option value="Fashion">Jarayonda</Option>
              <Option value="Watches">Tayyor</Option>
            </Select>
          </div>

          {/* Loyiha vibor  */}
          <div>
            <Typography
              variant="small"
              color="blue-gray"
              className="mb-2 text-left font-medium"
            >
              Loyiha
            </Typography>

            <Select
              className="!w-full !border-[1.5px] !border-blue-gray-200/90 !border-t-blue-gray-200/90 bg-white text-gray-800 ring-4 ring-transparent placeholder:text-gray-600 focus:!border-primary focus:!border-t-blue-gray-900 group-hover:!border-primary"
              placeholder="1"
              labelProps={{
                className: "hidden",
              }}
              value={project}
              onChange={setProject}
            >
              <Option value="Clothing">Clothing</Option>
              <Option value="Fashion">Fashion</Option>
              <Option value="Watches">Watches</Option>
            </Select>
          </div>
          {/* Loyiha haqida  */}
          <div>
            <Typography
              variant="small"
              color="blue-gray"
              className="mb-2 text-left font-medium"
            >
              Proyekt haqida
            </Typography>
            <Textarea
              rows={7}
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kontentingizni shu yerda chop eting...."
              className="!w-full !border-[1.5px] !border-blue-gray-200/90 !border-t-blue-gray-200/90 bg-white text-gray-600 ring-4 ring-transparent focus:!border-primary focus:!border-t-blue-gray-900 group-hover:!border-primary"
              labelProps={{
                className: "hidden",
              }}
            />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button
            className="ml-auto bg-borderlog"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Yuklanmoqda..." : "Loyiha qo'shish"}
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}
