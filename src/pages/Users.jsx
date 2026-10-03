import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { api, apiMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/Button";
import { Input, Select } from "../components/Input";
import { Modal } from "../components/Modal";
import { Table } from "../components/Table";
import { RecordPreview } from "../components/RecordPreview";
import { AuthImage } from "../components/AuthImage";
import {
  Pagination,
  Notice,
  RowActions,
  FigmaIcon,
} from "../components/Workspace";
import { useCollection } from "../api/workspace";
const empty = {
  name: "",
  surname: "",
  phone: "",
  email: "",
  address: "",
  username: "",
  password: "",
  position: "3d dizayner",
  status: "User",
  active: true,
};
export default function Users() {
  const { user, hasRole } = useAuth(),
    [params, setParams] = useSearchParams(),
    [viewing, setViewing] = useState(null),
    input = useRef(null),
    [search, setSearch] = useState(""),
    [form, setForm] = useState(empty),
    [open, setOpen] = useState(false),
    [editing, setEditing] = useState(null),
    [photo, setPhoto] = useState(null),
    [preview, setPreview] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    c = useCollection("/api/users", { search });
  useEffect(() => {
    if (!photo) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);
  const edit = (item) => {
    setEditing(item?.id || null);
    setForm(item ? { ...empty, ...item, password: "" } : empty);
    setPhoto(null);
    setError("");
    setOpen(true);
  };
  const recordId = params.get("record");
  useEffect(() => {
    if (!recordId) return;
    const controller = new AbortController();
    api
      .get(`/api/users/${recordId}`, { signal: controller.signal })
      .then(({ data }) => setViewing(data))
      .catch((e) => {
        if (e.code !== "ERR_CANCELED") setError(apiMessage(e));
      });
    return () => controller.abort();
  }, [recordId]);

  const closePreview = () => {
    setViewing(null);
    const next = new URLSearchParams(params);
    next.delete("record");
    next.delete("file");
    setParams(next, { replace: true });
  };
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const payload = { ...form };
      if (editing && !payload.password) delete payload.password;
      const { data } = await api[editing ? "patch" : "post"](
        editing ? `/api/users/${editing}` : "/api/users",
        payload,
      );
      if (photo) {
        const body = new FormData();
        body.append("userId", data.id);
        body.append("file", photo);
        try {
          await api.post("/api/profile/avatar", body);
        } catch (e) {
          setEditing(data.id);
          c.reload();
          setError(`Xodim saqlandi, ammo rasm yuklanmadi: ${apiMessage(e)}`);
          return;
        }
      }
      setOpen(false);
      setEditing(null);
      c.reload();
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      setBusy(false);
    }
  };
  if (!hasRole("Admin")) return <Notice error="Bu bo'lim uchun ruxsat yo'q" />;
  return (
    <div>
      <div className="page-heading">
        <h1>Foydalanuvchilar</h1>
        <Button onClick={() => edit(null)}>Xodim qo'shish</Button>
      </div>
      <div className="filter-bar">
        <input
          aria-label="Xodim qidirish"
          placeholder="Qidirish"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <Notice
        error={c.error || (!open ? error : "")}
        loading={c.loading}
        onRetry={c.reload}
      />
      {!c.loading && (
        <Table
          columns={[
            "Xodim",
            "Lavozim",
            "Telefon",
            "Email",
            "Ruxsat",
            "Holat",
            "",
          ]}
          rows={c.rows}
          renderRow={(u) => (
            <tr key={u.id} className="data-row">
              <td>
                <div className="flex items-center gap-3">
                  <AuthImage
                    src={u.avatar}
                    alt=""
                    className="h-9 w-9 rounded-full object-cover"
                  />
                  <button className="record-link" onClick={() => setViewing(u)}>
                    {u.name} {u.surname}
                  </button>
                </div>
              </td>
              <td>{u.position || "—"}</td>
              <td>{u.phone || "—"}</td>
              <td>{u.email}</td>
              <td>{u.status}</td>
              <td>{u.active ? "Faol" : "Bloklangan"}</td>
              <td>
                <RowActions
                  onEdit={
                    user.status === "Owner" || u.status !== "Owner"
                      ? () => edit(u)
                      : null
                  }
                />
              </td>
            </tr>
          )}
        />
      )}
      <Pagination {...c} onChange={c.setPage} />
      <RecordPreview
        item={viewing}
        title={[viewing?.name, viewing?.surname].filter(Boolean).join(" ")}
        onClose={closePreview}
        fields={[
          ["Email", viewing?.email],
          ["Telefon", viewing?.phone],
          ["Lavozim", viewing?.position],
          ["Manzil", viewing?.address],
          ["Ruxsat", viewing?.status],
          ["Holat", viewing?.active ? "Faol" : "Bloklangan"],
        ]}
        onEdit={
          viewing && (user.status === "Owner" || viewing.status !== "Owner")
            ? () => {
                const item = viewing;
                closePreview();
                edit(item);
              }
            : undefined
        }
      />
      <Modal
        size="wide"
        open={open}
        dismissible={!busy}
        title={editing ? "Xodimni tahrirlash" : "Xodim qo'shish"}
        onClose={() => setOpen(false)}
      >
        <form className="form-grid" onSubmit={submit}>
          <Notice error={error} />
          <div className="employee-top">
            <div className="employee-avatar">
              {preview || form.avatar ? (
                <AuthImage src={preview || form.avatar} alt="Xodim rasmi" />
              ) : (
                <span className="employee-placeholder">
                  <FigmaIcon screen="employee-form" name="imgGroup2" />
                  <FigmaIcon screen="employee-form" name="imgGroup3" />
                </span>
              )}
              <button
                type="button"
                aria-label="Xodim rasmini tanlash"
                onClick={() => input.current.click()}
              >
                <span className="figma-camera">
                  <FigmaIcon screen="employee-form" name="imgGroup4" />
                  <FigmaIcon screen="employee-form" name="imgGroup5" />
                  <FigmaIcon screen="employee-form" name="imgGroup6" />
                </span>
              </button>
              <input
                ref={input}
                hidden
                type="file"
                accept=".png,.jpg,.jpeg,.webp"
                onChange={(e) => setPhoto(e.target.files?.[0] || null)}
              />
            </div>
            <Select
              label="Lavozim/Pozitsiya"
              value={form.position}
              onChange={(e) => setForm({ ...form, position: e.target.value })}
            >
              {[
                "3d dizayner",
                "Arxitektor",
                "Menejer",
                "Asosiy arxitektor",
                ...(form.position &&
                ![
                  "3d dizayner",
                  "Arxitektor",
                  "Menejer",
                  "Asosiy arxitektor",
                ].includes(form.position)
                  ? [form.position]
                  : []),
              ].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </Select>
          </div>
          <h3 className="employee-section">Asosiy ma'lumotlar</h3>
          <div className="form-columns">
            <Input
              label="Ism"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              label="Familiya"
              value={form.surname}
              onChange={(e) => setForm({ ...form, surname: e.target.value })}
            />
          </div>
          <h3 className="employee-section">Bog'lanish uchun ma'lumot</h3>
          <div className="form-columns">
            <Input
              label="Telefon nomer"
              placeholder="+998"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              required
              value={form.email}
              onChange={(e) =>
                setForm({
                  ...form,
                  email: e.target.value,
                  username: form.username || e.target.value.split("@")[0],
                })
              }
            />
          </div>
          <Input
            label="Manzil"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <div className="form-columns">
            <Select
              label="Ruxsat darajasi"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              {[
                "User",
                "Manager",
                "Admin",
                ...(user.status === "Owner" ? ["Owner"] : []),
              ].map((v) => (
                <option value={v} key={v}>
                  {v}
                </option>
              ))}
            </Select>
            <Input
              label={editing ? "Yangi parol (ixtiyoriy)" : "Boshlang'ich parol"}
              type="password"
              required={!editing}
              minLength={12}
              maxLength={72}
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          {editing && editing !== user.id && (
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
              Kirishga ruxsat berish
            </label>
          )}
          <Button type="submit" disabled={busy} className="justify-self-end">
            {busy ? "Saqlanmoqda..." : editing ? "Saqlash" : "Qo'shish"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
