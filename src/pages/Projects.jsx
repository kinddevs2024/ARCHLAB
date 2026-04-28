import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaChevronRight, FaPen, FaTrash } from "react-icons/fa";
import { api, apiMessage } from "../api/client";
import { Button } from "../components/Button";
import { Input, Select, Textarea } from "../components/Input";
import { Modal } from "../components/Modal";
import { Table } from "../components/Table";
import { StatusBadge } from "../components/StatusBadge";

const empty = {
  title: "",
  company: "",
  objectName: "",
  objectAddress: "",
  customerName: "",
  customerPhone: "",
  contractAmount: "",
  category: "general",
  status: "new",
  description: "",
  assignedTo: [],
};

const categoryOptions = [
  ["general", "Loyiha"],
  ["single", "Yakka tartibdagi loyiha"],
  ["interior", "Interyer"],
  ["tex-obs", "Tex-obs"],
  ["laboratory", "Laboratoriya"],
  ["control", "Tashqi nazorat"],
  ["render", "Rendr"],
];

export default function Projects({ title, category }) {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [filters, setFilters] = useState({ search: "", status: "", year: "" });
  const [form, setForm] = useState({ ...empty, category: category || "general" });
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    const { data } = await api.get(`/api/projects?${params}`);
    setRows(data.data);
    setMeta(data.meta);
  }, [category, filters]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api.get("/api/users?limit=100").then(({ data }) => setUsers(data.data)).catch(() => setUsers([]));
  }, []);

  const resetCreate = () => {
    setEditing(null);
    setForm({ ...empty, category: category || "general" });
    setError("");
    setOpen(true);
  };

  const edit = (project) => {
    setEditing(project.id);
    setForm({
      ...empty,
      ...project,
      contractAmount: project.contractAmount || "",
      assignedTo: (project.assignedTo || []).map((user) => user.id || user),
    });
    setError("");
    setOpen(true);
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      if (editing) await api.patch(`/api/projects/${editing}`, form);
      else await api.post("/api/projects", form);
      setOpen(false);
      await load();
    } catch (err) {
      setError(apiMessage(err, "Loyihani saqlashda xatolik"));
    }
  };

  const remove = async (id) => {
    await api.delete(`/api/projects/${id}`);
    await load();
  };

  return (
    <div>
      <div className="mb-[26px] flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[34px] font-extrabold tracking-[-0.02em]">{title}</h1>
          <p className="mt-1 text-sm text-[#7d8291]">Jami: {meta?.total || 0}</p>
        </div>
        <div className="flex gap-4">
          <Button className="h-[49px] px-6 text-[16px]" onClick={resetCreate}>Yangi</Button>
        </div>
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-[1fr_170px_130px_auto]">
        <Input placeholder="Loyiha, mijoz yoki obyekt qidirish" value={filters.search} onChange={(e) => setFilters((x) => ({ ...x, search: e.target.value }))} />
        <Select value={filters.status} onChange={(e) => setFilters((x) => ({ ...x, status: e.target.value }))}>
          <option value="">Barcha status</option>
          <option value="new">Yangi</option>
          <option value="in_progress">Jarayonda</option>
          <option value="done">Tayyor</option>
          <option value="archived">Arxiv</option>
        </Select>
        <Input type="number" placeholder="Yil" value={filters.year} onChange={(e) => setFilters((x) => ({ ...x, year: e.target.value }))} />
        <Button variant="secondary" onClick={load}>Filter</Button>
      </div>

      <Table
        columns={["Loyiha", "Mijoz", "Tel raqam", "Kategoriya", "Status", "Sana", "Amal"]}
        rows={rows}
        empty="Hali loyiha yo'q"
        renderRow={(project, index) => (
          <tr key={project.id} className={`h-[58px] shadow-sm ${index === 0 ? "bg-[#c9a77f] text-white" : "bg-white text-[#303442] dark:bg-[#20262d] dark:text-white"}`}>
            <td className="rounded-l-[5px] px-4">
              <button className="flex items-center gap-3 text-left font-semibold" onClick={() => navigate(`/projects/${project.id}`)}>
                <FaChevronRight /> {project.title}
              </button>
            </td>
            <td className="px-4">{project.customerName || "-"}</td>
            <td className="px-4">{project.customerPhone || "-"}</td>
            <td className="px-4">{project.category}</td>
            <td className="px-4"><StatusBadge value={project.status} /></td>
            <td className="px-4">{project.date ? new Date(project.date).toLocaleDateString() : "-"}</td>
            <td className="rounded-r-[5px] px-4">
              <div className="flex gap-2">
                <button className="grid h-8 w-8 place-items-center rounded-full bg-white/35 text-[#c9a77f]" onClick={() => edit(project)}><FaPen className="text-xs" /></button>
                <button className="grid h-8 w-8 place-items-center rounded-full bg-[#fff1f1] text-[#ff1f2f]" onClick={() => remove(project.id)}><FaTrash className="text-xs" /></button>
              </div>
            </td>
          </tr>
        )}
      />

      <Modal open={open} title={editing ? "Loyihani tahrirlash" : "Loyiha yaratish"} onClose={() => setOpen(false)}>
        {error ? <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
        <form className="grid gap-[18px]" onSubmit={submit}>
          <Input label="Loyiha nomi" value={form.title} onChange={(e) => setForm((x) => ({ ...x, title: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Mijoz ismi" value={form.customerName} onChange={(e) => setForm((x) => ({ ...x, customerName: e.target.value }))} />
            <Input label="Tel raqam" value={form.customerPhone} onChange={(e) => setForm((x) => ({ ...x, customerPhone: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Obyekt nomi" value={form.objectName} onChange={(e) => setForm((x) => ({ ...x, objectName: e.target.value }))} />
            <Input label="Manzil" value={form.objectAddress} onChange={(e) => setForm((x) => ({ ...x, objectAddress: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Kategoriya" value={form.category} onChange={(e) => setForm((x) => ({ ...x, category: e.target.value }))}>
              {categoryOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </Select>
            <Select label="Status" value={form.status} onChange={(e) => setForm((x) => ({ ...x, status: e.target.value }))}>
              <option value="new">Yangi</option>
              <option value="in_progress">Jarayonda</option>
              <option value="done">Tayyor</option>
              <option value="archived">Arxiv</option>
            </Select>
          </div>
          <Input label="Summa" type="number" value={form.contractAmount} onChange={(e) => setForm((x) => ({ ...x, contractAmount: e.target.value }))} />
          <Select label="Biriktirilgan xodim" value={form.assignedTo[0] || ""} onChange={(e) => setForm((x) => ({ ...x, assignedTo: e.target.value ? [e.target.value] : [] }))}>
            <option value="">Tanlanmagan</option>
            {users.map((user) => <option key={user.id} value={user.id}>{user.name || user.username || user.email}</option>)}
          </Select>
          <Textarea label="Proyekt haqida" value={form.description} onChange={(e) => setForm((x) => ({ ...x, description: e.target.value }))} />
          <Button className="h-[57px] w-[202px] text-[16px]" type="submit">Saqlash</Button>
        </form>
      </Modal>
    </div>
  );
}
