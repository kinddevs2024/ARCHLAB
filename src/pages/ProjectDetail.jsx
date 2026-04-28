import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { FaDownload, FaFolder, FaPen, FaTrash, FaUpload } from "react-icons/fa";
import { api, apiMessage } from "../api/client";
import { Button } from "../components/Button";
import { Input, Select, Textarea } from "../components/Input";
import { Modal } from "../components/Modal";
import { Table } from "../components/Table";
import { StatusBadge } from "../components/StatusBadge";

const defaultFolders = [
  "Firmaga xat",
  "KADASTR",
  "RUXSATNOMA",
  "APZ",
  "APZ-2 Tex-Usloviya",
  "Eskiz",
  "Obyekt foto",
  "Planshet",
  "Qo'shni roziliklari",
  "Toposyomka",
];

const emptyFolder = { title: "", status: "new", description: "" };

export default function ProjectDetail() {
  const { id } = useParams();
  const fileRef = useRef(null);
  const [project, setProject] = useState(null);
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [form, setForm] = useState(emptyFolder);
  const [folderOpen, setFolderOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [projectRes, foldersRes, filesRes] = await Promise.all([
      api.get(`/api/projects/${id}`),
      api.get(`/api/project-folders?project=${id}&limit=100`),
      api.get(`/api/files?project=${id}&limit=100`),
    ]);
    setProject(projectRes.data);
    setFolders(foldersRes.data.data);
    setFiles(filesRes.data.data);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const createDefaults = async () => {
    await Promise.all(defaultFolders.map((title, order) => api.post("/api/project-folders", { project: id, title, order })));
    await load();
  };

  const saveFolder = async (event) => {
    event.preventDefault();
    setError("");
    try {
      if (selectedFolder) await api.patch(`/api/project-folders/${selectedFolder}`, form);
      else await api.post("/api/project-folders", { ...form, project: id });
      setFolderOpen(false);
      setSelectedFolder(null);
      setForm(emptyFolder);
      await load();
    } catch (err) {
      setError(apiMessage(err, "Papkani saqlashda xatolik"));
    }
  };

  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const body = new FormData();
    body.append("project", id);
    body.append("kind", "project");
    body.append("entityType", "projects");
    body.append("entityId", id);
    body.append("section", "archive");
    body.append("file", file);
    await api.post("/api/files", body);
    event.target.value = "";
    await load();
  };

  const download = async (file) => {
    const response = await api.get(`/api/files/${file.id}/download`, { responseType: "blob" });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.originalName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="mb-[26px] flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[34px] font-extrabold tracking-[-0.02em]">{project?.title || "Loyiha"}</h1>
          <p className="mt-1 text-sm text-[#7d8291]">{project?.customerName || ""} {project?.customerPhone || ""}</p>
        </div>
        <div className="flex gap-4">
          <Button className="h-[49px] px-6 text-[16px]" onClick={() => fileRef.current?.click()}><FaUpload /> Yuklash</Button>
          <Button className="h-[49px] px-6 text-[16px]" onClick={() => setFolderOpen(true)}>Yangi papka</Button>
          {!folders.length ? <Button className="h-[49px] px-6 text-[16px]" onClick={createDefaults}>Standart papkalar</Button> : null}
          <input ref={fileRef} className="hidden" type="file" onChange={upload} />
        </div>
      </div>

      <Table
        columns={["Papka", "Status", "Sana", "Tahrirlash", "O'chirish"]}
        rows={folders}
        empty="Bu loyiha ichida papkalar hali yo'q"
        renderRow={(folder, index) => (
          <tr key={folder.id} className={`h-[58px] shadow-sm ${index === 0 ? "bg-[#c9a77f] text-white" : "bg-white text-[#303442] dark:bg-[#20262d] dark:text-white"}`}>
            <td className="rounded-l-[5px] px-4">
              <div className="flex items-center gap-4"><FaFolder className="text-[26px]" /> {folder.title}</div>
            </td>
            <td className="px-4"><StatusBadge value={folder.status} /></td>
            <td className="px-4">{folder.date ? new Date(folder.date).toLocaleDateString() : "-"}</td>
            <td className="px-4">
              <button className="grid h-8 w-8 place-items-center rounded-full bg-white/35 text-[#c9a77f]" onClick={() => { setSelectedFolder(folder.id); setForm({ title: folder.title, status: folder.status, description: folder.description || "" }); setFolderOpen(true); }}>
                <FaPen className="text-xs" />
              </button>
            </td>
            <td className="rounded-r-[5px] px-4">
              <button className="grid h-8 w-8 place-items-center rounded-full bg-[#fff1f1] text-[#ff1f2f]" onClick={async () => { await api.delete(`/api/project-folders/${folder.id}`); await load(); }}>
                <FaTrash className="text-xs" />
              </button>
            </td>
          </tr>
        )}
      />

      <h2 className="mb-3 mt-8 text-2xl font-bold">Fayllar</h2>
      <Table
        columns={["Nomi", "Tur", "Hajm", "Sana", "Yuklash"]}
        rows={files}
        empty="Fayllar hali yuklanmagan"
        renderRow={(file, index) => (
          <tr key={file.id} className={`h-[58px] shadow-sm ${index === 0 ? "bg-[#c9a77f] text-white" : "bg-white text-[#303442] dark:bg-[#20262d] dark:text-white"}`}>
            <td className="rounded-l-[5px] px-4">{file.originalName}</td>
            <td className="px-4">{file.extension || file.kind}</td>
            <td className="px-4">{Math.round(file.size / 1024)} KB</td>
            <td className="px-4">{new Date(file.createdAt).toLocaleDateString()}</td>
            <td className="rounded-r-[5px] px-4"><button className="h-8 rounded-[8px] bg-white px-3 text-[#303442] shadow" onClick={() => download(file)}><FaDownload className="mr-2 inline" />Yuklash</button></td>
          </tr>
        )}
      />

      <Modal open={folderOpen} title={selectedFolder ? "Papkani tahrirlash" : "Papka yaratish"} onClose={() => setFolderOpen(false)}>
        {error ? <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
        <form className="grid gap-[18px]" onSubmit={saveFolder}>
          <Input label="Papka nomi" value={form.title} onChange={(event) => setForm((x) => ({ ...x, title: event.target.value }))} />
          <Select label="Status" value={form.status} onChange={(event) => setForm((x) => ({ ...x, status: event.target.value }))}>
            <option value="new">Yangi</option>
            <option value="in_progress">Jarayonda</option>
            <option value="done">Tayyor</option>
            <option value="archived">Arxiv</option>
          </Select>
          <Textarea label="Izoh" value={form.description} onChange={(event) => setForm((x) => ({ ...x, description: event.target.value }))} />
          <Button className="h-[57px] w-[202px] text-[16px]" type="submit">Saqlash</Button>
        </form>
      </Modal>
    </div>
  );
}
