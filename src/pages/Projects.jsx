import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, apiMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/Button";
import { Input, Select, Textarea } from "../components/Input";
import { Modal } from "../components/Modal";
import { Table } from "../components/Table";
import { RecordPreview } from "../components/RecordPreview";
import { StatusBadge } from "../components/StatusBadge";
import { FileArchiveModal } from "../components/FileArchiveModal";
import {
  Notice,
  Pagination,
  YearFilter,
  FigmaIcon,
  RowActions,
  ConfirmAction,
} from "../components/Workspace";
import { useCollection, idOf, dateLabel } from "../api/workspace";
const categories = [
  ["general", "Loyiha"],
  ["single", "Yakka tartibdagi loyiha"],
  ["interior", "Interyer"],
  ["tex-obs", "Tex-obs"],
  ["laboratory", "Laboratoriya"],
  ["control", "Tashqi nazorat"],
  ["render", "Rendr"],
];
const empty = {
  title: "",
  company: "",
  objectName: "",
  objectAddress: "",
  customerName: "",
  customerPhone: "",
  contractAmount: 0,
  description: "",
  status: "new",
  date: "",
  category: "general",
  assignedTo: [],
  helper: "",
  master: "",
};
export default function Projects({ title = "Loyihalar", category }) {
  const navigate = useNavigate(),
    [params, setParams] = useSearchParams(),
    [viewing, setViewing] = useState(null),
    { hasRole } = useAuth(),
    [year, setYear] = useState(""),
    [search, setSearch] = useState(""),
    [trash, setTrash] = useState(false),
    [users, setUsers] = useState([]),
    [open, setOpen] = useState(false),
    [editing, setEditing] = useState(null),
    [form, setForm] = useState(empty),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [remove, setRemove] = useState(null),
    [archive, setArchive] = useState(null),
    collection = useCollection("/api/projects", {
      category,
      year,
      search,
      trash,
    });
  useEffect(() => {
    api
      .get("/api/users/directory")
      .then(({ data }) => setUsers(data.data))
      .catch(() => {});
  }, []);
  const recordId = params.get("record");
  useEffect(() => {
    if (!recordId) return;
    const controller = new AbortController();
    api
      .get(`/api/projects/${recordId}`, { signal: controller.signal })
      .then(({ data }) => setViewing(data))
      .catch((e) => {
        if (e.code !== "ERR_CANCELED") setError(apiMessage(e));
      });
    return () => controller.abort();
  }, [recordId]);
  const closePreview = () => {
    setViewing(null);
    if (recordId) {
      const next = new URLSearchParams(params);
      next.delete("record");
      setParams(next, { replace: true });
    }
  };
  const create = () => {
    setEditing(null);
    setForm({
      ...empty,
      category: category || "general",
      date: new Date().toISOString().slice(0, 10),
    });
    setError("");
    setOpen(true);
  };
  const edit = (item) => {
    setEditing(item.id);
    setForm({
      ...empty,
      ...item,
      date: item.date?.slice(0, 10) || "",
      assignedTo: item.assignedTo.map(idOf),
      helper: idOf(item.helper),
      master: idOf(item.master),
    });
    setError("");
    setOpen(true);
  };
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = {
        ...form,
        title: form.title || form.objectName || form.customerName,
      };
      if (!hasRole("Admin"))
        for (const key of ["assignedTo", "helper", "master", "category"])
          delete data[key];
      await api[editing ? "patch" : "post"](
        editing ? `/api/projects/${editing}` : "/api/projects",
        data,
      );
      setOpen(false);
      collection.reload();
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const action = async () => {
    setBusy(true);
    try {
      await api.delete(`/api/projects/${remove.id}`);
      setRemove(null);
      collection.reload();
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      <div className="page-heading">
        <h1>{title}</h1>
        <div className="heading-actions">
          <YearFilter value={year} onChange={setYear} />
          {hasRole("Admin") && !trash && (
            <Button onClick={create}>Yangi loyiha</Button>
          )}
        </div>
      </div>
      <div className="filter-bar">
        <input
          placeholder="Loyiha yoki mijozni qidirish"
          aria-label="Loyihalarni qidirish"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {hasRole("Manager") && (
          <Button variant="ghost" onClick={() => setTrash((v) => !v)}>
            {trash ? "Faol loyihalar" : "Arxiv"}
          </Button>
        )}
      </div>
      <Notice
        error={collection.error || (!open ? error : "")}
        loading={collection.loading}
        onRetry={collection.reload}
      />
      {!collection.loading && !collection.error && (
        <Table
          columns={[
            "",
            "Kompaniya nomi",
            "Obyekt nomi",
            "Obyekt joyi",
            "Sana",
            "Yuklash",
            "",
          ]}
          rows={collection.rows}
          empty="Hali loyiha yo'q"
          renderRow={(item) => (
            <tr key={item.id} className="data-row">
              <td>
                <StatusBadge value={item.status} />
              </td>
              <td>
                <button
                  className="folder-name"
                  onClick={() => setViewing(item)}
                  disabled={trash}
                >
                  <FigmaIcon name="imgFolderIcon" />
                  {item.company || item.title}
                </button>
              </td>
              <td>{item.objectName || item.title}</td>
              <td>{item.objectAddress || "—"}</td>
              <td className="whitespace-nowrap">{dateLabel(item.date)}</td>
              <td>
                {!trash && (
                  <button
                    className="file-type-button"
                    onClick={() => setArchive(item)}
                  >
                    Yuklash
                  </button>
                )}
              </td>
              <td>
                <RowActions
                  onEdit={
                    !trash && hasRole("Manager") ? () => edit(item) : null
                  }
                  onArchive={
                    !trash && hasRole("Manager")
                      ? () => {
                          setError("");
                          setRemove(item);
                        }
                      : null
                  }
                  onRestore={
                    trash
                      ? async () => {
                          try {
                            await api.post(`/api/projects/${item.id}/restore`);
                            collection.reload();
                          } catch (e) {
                            setError(apiMessage(e));
                          }
                        }
                      : null
                  }
                />
              </td>
            </tr>
          )}
        />
      )}
      <Pagination {...collection} onChange={collection.setPage} />
      <Modal
        open={open}
        dismissible={!busy}
        title={editing ? "Loyihani tahrirlash" : "Loyiha yaratish"}
        onClose={() => setOpen(false)}
      >
        <form className="form-grid" onSubmit={submit}>
          <Notice error={error} />
          <Input
            label="Mijoz ismi"
            required
            value={form.customerName}
            onChange={(e) => setForm({ ...form, customerName: e.target.value })}
          />
          {hasRole("Admin") && (
            <>
              <Select
                label="Yordamchi ismi"
                value={form.helper}
                onChange={(e) => setForm({ ...form, helper: e.target.value })}
              >
                <option value="">Tanlang</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} {u.surname}
                  </option>
                ))}
              </Select>
              <Select
                label="Ustaning ismi"
                value={form.master}
                onChange={(e) => setForm({ ...form, master: e.target.value })}
              >
                <option value="">Tanlang</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} {u.surname}
                  </option>
                ))}
              </Select>
              <Select
                label="Loyiha"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {categories.map(([v, t]) => (
                  <option key={v} value={v}>
                    {t}
                  </option>
                ))}
              </Select>
            </>
          )}
          <Textarea
            label="Proyekt haqida"
            placeholder="Kontentingizni shu yerda chop eting...."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <details open={!!editing}>
            <summary className="cursor-pointer text-gray-500">
              Qo'shimcha ma'lumotlar
            </summary>
            <div className="form-grid mt-4">
              {[
                ["title", "Loyiha nomi"],
                ["company", "Kompaniya nomi"],
                ["objectName", "Obyekt nomi"],
                ["objectAddress", "Obyekt joyi"],
                ["customerPhone", "Tel raqam"],
              ].map(([key, label]) => (
                <Input
                  key={key}
                  label={label}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              ))}
              <Input
                label="Sana"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
              <Input
                label="Dog summa"
                type="number"
                min="0"
                value={form.contractAmount}
                onChange={(e) =>
                  setForm({ ...form, contractAmount: e.target.value })
                }
              />
              <Select
                label="Status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {["new", "in_progress", "done", "archived"].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </Select>
              {hasRole("Admin") && (
                <Select
                  label="Biriktirilgan xodimlar"
                  multiple
                  value={form.assignedTo}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      assignedTo: [...e.target.selectedOptions].map(
                        (o) => o.value,
                      ),
                    })
                  }
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name || u.email} {u.surname}
                    </option>
                  ))}
                </Select>
              )}
            </div>
          </details>
          <Button
            type="submit"
            disabled={busy}
            className="justify-self-start h-[57px]"
          >
            {busy ? "Saqlanmoqda..." : editing ? "Saqlash" : "Loyiha yaratish"}
          </Button>
        </form>
      </Modal>
      <RecordPreview
        item={viewing}
        onClose={closePreview}
        title={viewing?.company || viewing?.title}
        fields={[
          ["Loyiha nomi", viewing?.title],
          ["Kompaniya", viewing?.company],
          ["Obyekt", viewing?.objectName],
          ["Manzil", viewing?.objectAddress],
          ["Mijoz", viewing?.customerName],
          ["Telefon", viewing?.customerPhone],
          ["Sana", viewing?.date ? dateLabel(viewing.date) : null],
          ["Izoh", viewing?.description],
        ]}
        onEdit={
          hasRole("Manager") && !trash
            ? () => {
                const item = viewing;
                closePreview();
                edit(item);
              }
            : undefined
        }
        onWorkspace={
          !trash
            ? () => {
                navigate(`/projects/${viewing.id}`);
              }
            : undefined
        }
      />
      <ConfirmAction
        itemLabel={remove?.title || remove?.originalName}
        error={error}
        open={!!remove}
        onClose={() => {
          setError("");
          setRemove(null);
        }}
        onConfirm={action}
        busy={busy}
      />
      <FileArchiveModal
        open={!!archive}
        onClose={() => setArchive(null)}
        title={archive?.title}
        entityType="projects"
        entityId={archive?.id}
        project={archive?.id}
        kind="project"
      />
    </div>
  );
}
