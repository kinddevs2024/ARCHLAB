import { useEffect, useState } from "react";
import { FaCamera, FaMapMarkerAlt, FaUser } from "react-icons/fa";
import { api, apiMessage } from "../api/client";
import { Button } from "../components/Button";
import { Input, Select } from "../components/Input";
import { Modal } from "../components/Modal";
import { Table } from "../components/Table";

const empty = { name: "", surname: "", phone: "", address: "", username: "", email: "", password: "", status: "User" };

export default function Users() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(empty);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    const { data } = await api.get("/api/users?limit=100");
    setRows(data.data);
  };

  useEffect(() => { load(); }, []);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await api.post("/api/users", form);
      setOpen(false);
      setForm(empty);
      await load();
    } catch (err) {
      setError(apiMessage(err, "Foydalanuvchini saqlashda xatolik"));
    }
  };

  const deactivate = async (id) => {
    await api.delete(`/api/users/${id}`);
    await load();
  };

  return (
    <div>
      <div className="mb-[28px] flex items-center justify-between">
        <h1 className="text-[34px] font-extrabold tracking-[-0.02em]">Foydalanuvchilar</h1>
        <Button className="h-[49px] px-6 text-[16px]" onClick={() => setOpen(true)}>Xodim qo'shish</Button>
      </div>
      <Table
        columns={["Ism", "Familiya", "Lavozim", "Telefon", "Email", "Holat", ""]}
        rows={rows}
        renderRow={(user, index) => (
          <tr key={user.id} className={`h-[53px] shadow-sm ${index === 0 ? "bg-[#c9a77f] text-white" : "bg-white text-[#303442] dark:bg-[#20262d] dark:text-white"}`}>
            <td className="rounded-l-[5px] px-4">{user.name || user.username || "-"}</td>
            <td className="px-4">{user.surname || "-"}</td>
            <td className="px-4">{user.status}</td>
            <td className="px-4">{user.phone || "-"}</td>
            <td className="px-4">{user.email}</td>
            <td className="px-4">{user.active ? "Active" : "Blocked"}</td>
            <td className="rounded-r-[5px] px-4"><Button variant="danger" onClick={() => deactivate(user.id)}>Block</Button></td>
          </tr>
        )}
      />

      <Modal open={open} title="Xodim qo'shish" onClose={() => setOpen(false)}>
        {error ? <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
        <form className="grid gap-[18px]" onSubmit={submit}>
          <div className="grid grid-cols-[190px_1fr] items-center gap-10">
            <div className="relative mx-auto h-[108px] w-[108px]">
              <div className="grid h-full w-full place-items-center rounded-full bg-[#c8c8c8] text-white">
                <FaUser className="text-[76px]" />
              </div>
              <button className="absolute bottom-0 right-0 grid h-8 w-8 place-items-center rounded-full bg-[#c9a77f] text-white" type="button">
                <FaCamera className="text-[13px]" />
              </button>
            </div>
            <Select label="Lavozim/Pozitsiya" value={form.status} onChange={(e) => setForm((x) => ({ ...x, status: e.target.value }))}>
              <option value="User">3d dizayner</option>
              <option value="Manager">Arxitektor</option>
              <option value="Admin">Menejer</option>
              <option value="Owner">Owner</option>
            </Select>
          </div>

          <h3 className="text-[18px] font-bold text-[#7c8494]">Asosiy ma'lumotlar</h3>
          <div className="grid grid-cols-2 gap-5">
            <Input label="Ism" placeholder="Ism" value={form.name} onChange={(e) => setForm((x) => ({ ...x, name: e.target.value }))} />
            <Input label="Familiya" placeholder="Familiya" value={form.surname} onChange={(e) => setForm((x) => ({ ...x, surname: e.target.value }))} />
          </div>

          <h3 className="text-[18px] font-bold text-[#7c8494]">Bog'lanish uchun ma'lumot</h3>
          <div className="grid grid-cols-2 gap-5">
            <Input label="Telefon nomer" placeholder="+998" value={form.phone} onChange={(e) => setForm((x) => ({ ...x, phone: e.target.value }))} />
            <Input label="Email" placeholder="email@example.com" type="email" value={form.email} onChange={(e) => setForm((x) => ({ ...x, email: e.target.value, username: e.target.value.split("@")[0] }))} />
          </div>
          <Input label="Boshlang'ich parol" type="password" value={form.password} onChange={(e) => setForm((x) => ({ ...x, password: e.target.value }))} />
          <label className="relative block">
            <Input label="Manzil" placeholder="Manzil" value={form.address} onChange={(e) => setForm((x) => ({ ...x, address: e.target.value }))} />
            <FaMapMarkerAlt className="absolute bottom-[17px] right-5 text-xl text-[#7c8494]" />
          </label>
          <div className="flex justify-end pt-5">
            <Button className="h-[50px] w-[110px]" type="submit">Qo'shish</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
