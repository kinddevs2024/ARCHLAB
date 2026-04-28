import { useEffect, useState } from "react";
import { FaDownload, FaPen, FaTrash } from "react-icons/fa";
import { api, apiMessage } from "../api/client";
import { Button } from "../components/Button";
import { Input, Select, Textarea } from "../components/Input";
import { Modal } from "../components/Modal";
import { Table } from "../components/Table";
import { FileArchiveModal } from "../components/FileArchiveModal";

const empty = { title: "", direction: "outgoing", customerName: "", customerPhone: "", amount: "", status: "draft", notes: "" };

export default function Letters() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [archive, setArchive] = useState(null);
  const [fileCounts, setFileCounts] = useState({});
  const [error, setError] = useState("");

  const load = async () => {
    const [{ data }, counts] = await Promise.all([
      api.get("/api/letters?limit=100"),
      api.get("/api/files/counts?entityType=letters").catch(() => ({ data: { data: {} } })),
    ]);
    setRows(data.data);
    setFileCounts(counts.data.data || {});
  };
  useEffect(() => { load(); }, []);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      if (editing) await api.patch(`/api/letters/${editing}`, form);
      else await api.post("/api/letters", form);
      setOpen(false);
      setEditing(null);
      setForm(empty);
      await load();
    } catch (err) {
      setError(apiMessage(err, "Xatni saqlashda xatolik"));
    }
  };

  return (
    <div>
      <div className="mb-[28px] flex items-center justify-between">
        <h1 className="text-[34px] font-extrabold tracking-[-0.02em]">Xatlar</h1>
        <Button className="h-[49px] px-6 text-[16px]" onClick={() => setOpen(true)}>Yangi</Button>
      </div>
      <Table
        columns={["Sana", "Nomi", "Buyurtmachi ismi", "Tel raqam", "Dog summa", "Yo'nalish", "Yuklash", ""]}
        rows={rows}
        empty="Xatlar hali yo'q"
        renderRow={(item, index) => (
          <tr key={item.id} className={`h-[53px] shadow-sm ${index === 0 ? "bg-[#c9a77f] text-white" : "bg-white text-[#303442] dark:bg-[#20262d] dark:text-white"}`}>
            <td className="rounded-l-[5px] px-4">{item.date ? new Date(item.date).toLocaleDateString() : "-"}</td>
            <td className="px-4">{item.title}</td>
            <td className="px-4">{item.customerName || "-"}</td>
            <td className="px-4">{item.customerPhone || "-"}</td>
            <td className="px-4">{Number(item.amount || 0).toLocaleString()}</td>
            <td className="px-4">{item.direction}</td>
            <td className="px-4">
              <button className="h-8 rounded-[8px] bg-[#c9a77f] px-3 text-white shadow" onClick={() => setArchive(item)}>
                <FaDownload className="mr-2 inline" />Fayllar
                {fileCounts[item.id]?.count ? <span className="ml-2 rounded-full bg-white/25 px-2 text-xs">{fileCounts[item.id].count}</span> : null}
              </button>
            </td>
            <td className="rounded-r-[5px] px-4">
              <div className="flex gap-2">
                <button className="grid h-8 w-8 place-items-center rounded-full bg-white/35 text-[#c9a77f]" onClick={() => { setEditing(item.id); setForm({ ...empty, ...item }); setOpen(true); }}><FaPen className="text-xs" /></button>
                <button className="grid h-8 w-8 place-items-center rounded-full bg-[#fff1f1] text-[#ff1f2f]" onClick={async () => { await api.delete(`/api/letters/${item.id}`); await load(); }}><FaTrash className="text-xs" /></button>
              </div>
            </td>
          </tr>
        )}
      />
      <Modal open={open} title={editing ? "Xatni tahrirlash" : "Xat yaratish"} onClose={() => setOpen(false)}>
        {error ? <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
        <form className="grid gap-[18px]" onSubmit={submit}>
          <Input label="Nomi" value={form.title} onChange={(e) => setForm((x) => ({ ...x, title: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Buyurtmachi ismi" value={form.customerName} onChange={(e) => setForm((x) => ({ ...x, customerName: e.target.value }))} />
            <Input label="Tel raqam" value={form.customerPhone} onChange={(e) => setForm((x) => ({ ...x, customerPhone: e.target.value }))} />
          </div>
          <Input label="Dog summa" type="number" value={form.amount} onChange={(e) => setForm((x) => ({ ...x, amount: e.target.value }))} />
          <Select label="Yo'nalish" value={form.direction} onChange={(e) => setForm((x) => ({ ...x, direction: e.target.value }))}>
            <option value="outgoing">Chiquvchi</option>
            <option value="incoming">Kiruvchi</option>
          </Select>
          <Textarea label="Izoh" value={form.notes} onChange={(e) => setForm((x) => ({ ...x, notes: e.target.value }))} />
          <Button className="h-[57px] w-[202px] text-[16px]" type="submit">Saqlash</Button>
        </form>
      </Modal>
      <FileArchiveModal
        open={Boolean(archive)}
        onClose={() => { setArchive(null); load(); }}
        title={`${archive?.title || "Xat"} fayllari`}
        entityType="letters"
        entityId={archive?.id}
        kind="letter"
      />
    </div>
  );
}
