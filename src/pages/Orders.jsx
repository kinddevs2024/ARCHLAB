import { useEffect, useState } from "react";
import { FaDownload, FaPen, FaTrash } from "react-icons/fa";
import { api, apiMessage } from "../api/client";
import { Button } from "../components/Button";
import { Input, Select, Textarea } from "../components/Input";
import { Modal } from "../components/Modal";
import { Table } from "../components/Table";
import { StatusBadge } from "../components/StatusBadge";
import { FileArchiveModal } from "../components/FileArchiveModal";

const empty = { title: "", description: "", status: "todo", priority: "normal", dueDate: "", assignee: "", customerName: "", customerPhone: "" };

export default function Orders() {
  const [rows, setRows] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [archive, setArchive] = useState(null);
  const [fileCounts, setFileCounts] = useState({});
  const [error, setError] = useState("");

  const load = async () => {
    const [{ data }, counts] = await Promise.all([
      api.get("/api/orders?limit=100"),
      api.get("/api/files/counts?entityType=orders").catch(() => ({ data: { data: {} } })),
    ]);
    setRows(data.data);
    setFileCounts(counts.data.data || {});
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { api.get("/api/users?limit=100").then(({ data }) => setUsers(data.data)).catch(() => setUsers([])); }, []);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      if (editing) await api.patch(`/api/orders/${editing}`, form);
      else await api.post("/api/orders", form);
      setOpen(false);
      setEditing(null);
      setForm(empty);
      await load();
    } catch (err) {
      setError(apiMessage(err, "Buyuruqni saqlashda xatolik"));
    }
  };

  return (
    <div>
      <div className="mb-[28px] flex items-center justify-between">
        <h1 className="text-[34px] font-extrabold tracking-[-0.02em]">Buyuruqlar</h1>
        <Button className="h-[49px] px-6 text-[16px]" onClick={() => setOpen(true)}>Yangi</Button>
      </div>
      <Table
        columns={["Sana", "Nomi", "Buyurtmachi ismi", "Tel raqam", "Mas'ul", "Status", "Yuklash", ""]}
        rows={rows}
        empty="Buyuruqlar hali yo'q"
        renderRow={(item, index) => (
          <tr key={item.id} className={`h-[53px] shadow-sm ${index === 0 ? "bg-[#c9a77f] text-white" : "bg-white text-[#303442] dark:bg-[#20262d] dark:text-white"}`}>
            <td className="rounded-l-[5px] px-4">{item.dueDate ? new Date(item.dueDate).toLocaleDateString() : "-"}</td>
            <td className="px-4">{item.title}</td>
            <td className="px-4">{item.customerName || "-"}</td>
            <td className="px-4">{item.customerPhone || "-"}</td>
            <td className="px-4">{item.assignee?.name || item.assignee?.email || "-"}</td>
            <td className="px-4"><StatusBadge value={item.status} type="task" /></td>
            <td className="px-4">
              <button className="h-8 rounded-[8px] bg-[#c9a77f] px-3 text-white shadow" onClick={() => setArchive(item)}>
                <FaDownload className="mr-2 inline" />Fayllar
                {fileCounts[item.id]?.count ? <span className="ml-2 rounded-full bg-white/25 px-2 text-xs">{fileCounts[item.id].count}</span> : null}
              </button>
            </td>
            <td className="rounded-r-[5px] px-4">
              <div className="flex gap-2">
                <button className="grid h-8 w-8 place-items-center rounded-full bg-white/35 text-[#c9a77f]" onClick={() => { setEditing(item.id); setForm({ ...empty, ...item, assignee: item.assignee?.id || item.assignee || "", dueDate: item.dueDate ? item.dueDate.slice(0, 10) : "" }); setOpen(true); }}><FaPen className="text-xs" /></button>
                <button className="grid h-8 w-8 place-items-center rounded-full bg-[#fff1f1] text-[#ff1f2f]" onClick={async () => { await api.delete(`/api/orders/${item.id}`); await load(); }}><FaTrash className="text-xs" /></button>
              </div>
            </td>
          </tr>
        )}
      />
      <Modal open={open} title={editing ? "Vazifani tahrirlash" : "Vazifa yaratish"} onClose={() => setOpen(false)}>
        {error ? <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
        <form className="grid gap-[18px]" onSubmit={submit}>
          <Input label="Vazifa nomi" value={form.title} onChange={(e) => setForm((x) => ({ ...x, title: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Vazifa ustuvorligi" value={form.priority} onChange={(e) => setForm((x) => ({ ...x, priority: e.target.value }))}>
              <option value="low">Kamroq muhim</option><option value="normal">Normal</option><option value="high">Juda muhim</option>
            </Select>
            <Input label="Tugatish sanasi" type="date" value={form.dueDate} onChange={(e) => setForm((x) => ({ ...x, dueDate: e.target.value }))} />
            <Input label="Buyurtmachi ismi" value={form.customerName} onChange={(e) => setForm((x) => ({ ...x, customerName: e.target.value }))} />
            <Input label="Tel raqam" value={form.customerPhone} onChange={(e) => setForm((x) => ({ ...x, customerPhone: e.target.value }))} />
          </div>
          <Select label="Mas'ul xodim" value={form.assignee} onChange={(e) => setForm((x) => ({ ...x, assignee: e.target.value }))}>
            <option value="">Tanlanmagan</option>
            {users.map((user) => <option key={user.id} value={user.id}>{user.name || user.username || user.email}</option>)}
          </Select>
          <Textarea label="Vazifa tavsifi" value={form.description} onChange={(e) => setForm((x) => ({ ...x, description: e.target.value }))} />
          <Button className="h-[57px] w-[202px] text-[16px]" type="submit">Saqlash</Button>
        </form>
      </Modal>
      <FileArchiveModal
        open={Boolean(archive)}
        onClose={() => { setArchive(null); load(); }}
        title={`${archive?.title || "Buyuruq"} fayllari`}
        entityType="orders"
        entityId={archive?.id}
        kind="order"
      />
    </div>
  );
}
