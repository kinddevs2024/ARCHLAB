import { useCallback, useEffect, useRef, useState } from "react";
import { FaDownload, FaExternalLinkAlt, FaFolderOpen, FaTrash, FaUpload } from "react-icons/fa";
import { api, apiMessage } from "../api/client";
import { Button } from "./Button";
import { Modal } from "./Modal";

const appLabels = {
  ".dwg": "AutoCAD",
  ".dxf": "AutoCAD",
  ".rvt": "Revit",
  ".ifc": "BIM",
  ".skp": "SketchUp",
  ".pln": "ArchiCAD",
  ".3dm": "Rhino",
  ".max": "3ds Max",
  ".obj": "3D",
  ".fbx": "3D",
  ".pdf": "PDF",
  ".doc": "Word",
  ".docx": "Word",
  ".xls": "Excel",
  ".xlsx": "Excel",
};

const formatSize = (value = 0) => {
  if (value > 1024 * 1024 * 1024) return `${(value / 1024 / 1024 / 1024).toFixed(1)} GB`;
  if (value > 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)} MB`;
  if (value > 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${value} B`;
};

export function FileArchiveModal({ open, onClose, title, entityType, entityId, kind = "document", section = "archive" }) {
  const fileRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!open || !entityId) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/api/files", { params: { entityType, entityId, section, limit: 100 } });
      setFiles(data.data);
    } catch (err) {
      setError(apiMessage(err, "Fayllarni yuklashda xatolik"));
    } finally {
      setLoading(false);
    }
  }, [open, entityType, entityId, section]);

  useEffect(() => { load(); }, [load]);

  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const body = new FormData();
    body.append("kind", kind);
    body.append("entityType", entityType);
    body.append("entityId", entityId);
    body.append("section", section);
    body.append("file", file);
    try {
      await api.post("/api/files", body);
      await load();
    } catch (err) {
      setError(apiMessage(err, "Fayl yuklashda xatolik"));
    } finally {
      event.target.value = "";
    }
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

  const openNative = async (file) => {
    await download(file);
  };

  const remove = async (file) => {
    await api.delete(`/api/files/${file.id}`);
    await load();
  };

  return (
    <Modal open={open} title={title || "Fayllar arxivi"} onClose={onClose} size="wide">
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-[#7b8190] dark:text-slate-300">
            Fayllar MongoDB ichiga yozilmaydi. Ular shu kompyuterdagi lokal arxiv papkasida saqlanadi.
          </p>
          <Button className="h-11 px-5" type="button" onClick={() => fileRef.current?.click()}>
            <FaUpload /> Yuklash
          </Button>
          <input ref={fileRef} className="hidden" type="file" onChange={upload} />
        </div>

        {error ? <div className="rounded-[8px] bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

        <div className="overflow-hidden rounded-[8px] border border-[#e7ebf3] dark:border-slate-700">
          {loading ? (
            <div className="p-6 text-sm text-[#7b8190]">Yuklanmoqda...</div>
          ) : files.length ? (
            <div className="divide-y divide-[#edf0f6] dark:divide-slate-700">
              {files.map((file) => (
                <div key={file.id} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 bg-white px-4 py-3 dark:bg-[#20262d]">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 font-semibold text-[#303442] dark:text-white">
                      <FaFolderOpen className="shrink-0 text-[#c9a77f]" />
                      <span className="truncate">{file.originalName}</span>
                    </div>
                    <div className="mt-1 text-xs text-[#8b93a3]">
                      {file.extension || "file"} · {formatSize(file.size)} · {file.createdAt ? new Date(file.createdAt).toLocaleString() : ""}
                    </div>
                  </div>
                  <span className="rounded-full bg-[#f1f3f7] px-3 py-1 text-xs font-bold text-[#687083] dark:bg-slate-700 dark:text-slate-200">
                    {appLabels[file.extension] || "Open"}
                  </span>
                  <button className="grid h-9 w-9 place-items-center rounded-full bg-[#c9a77f] text-white" onClick={() => openNative(file)} title="Yuklab olib ochish">
                    <FaExternalLinkAlt className="text-xs" />
                  </button>
                  <div className="flex gap-2">
                    <button className="grid h-9 w-9 place-items-center rounded-full bg-[#f4f0eb] text-[#c9a77f]" onClick={() => download(file)} title="Yuklash">
                      <FaDownload className="text-xs" />
                    </button>
                    <button className="grid h-9 w-9 place-items-center rounded-full bg-[#fff1f1] text-[#ff1f2f]" onClick={() => remove(file)} title="O'chirish">
                      <FaTrash className="text-xs" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-[#7b8190] dark:text-slate-300">Bu yozuvga hali fayl yuklanmagan.</div>
          )}
        </div>
      </div>
    </Modal>
  );
}
