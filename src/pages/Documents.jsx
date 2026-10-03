import { projectOptions } from "../api/options";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, apiMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/Button";
import { Input, Select, Textarea } from "../components/Input";
import { Modal } from "../components/Modal";
import { Table } from "../components/Table";
import { FileArchiveModal } from "../components/FileArchiveModal";
import {
  Notice,
  Pagination,
  YearFilter,
  RowActions,
  ConfirmAction,
} from "../components/Workspace";
import { useCollection, dateLabel, amountLabel, idOf } from "../api/workspace";
const configs = {
  contracts: {
    title: "Shartnomalar",
    singular: "Shartnoma",
    date: "signedAt",
    kind: "contract",
    finance: true,
  },
  letters: { title: "Xatlar", singular: "Xat", date: "date", kind: "letter" },
  orders: {
    title: "Buyruqlar",
    singular: "Buyruq",
    date: "issuedAt",
    kind: "order",
  },
  expenses: {
    title: "Xarajatlar",
    singular: "Xarajat",
    date: "date",
    finance: true,
  },
};
const base = {
  title: "",
  contractNumber: "",
  customerName: "",
  customerPhone: "",
  amount: 0,
  advance: 0,
  totalPaid: 0,
  status: "draft",
  notes: "",
  description: "",
  signedAt: "",
  date: "",
  issuedAt: "",
  closedAt: "",
  project: "",
};
export default function Documents({ type, project, embedded = false }) {
  const conf = configs[type],
    { hasRole } = useAuth(),
    [params] = useSearchParams(),
    [year, setYear] = useState(""),
    [search, setSearch] = useState(""),
    [sort, setSort] = useState("desc"),
    [trash, setTrash] = useState(false),
    [open, setOpen] = useState(false),
    [editing, setEditing] = useState(null),
    [form, setForm] = useState(base),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [remove, setRemove] = useState(null),
    [archive, setArchive] = useState(null),
    [counts, setCounts] = useState({}),
    [projects, setProjects] = useState([]),
    [focused, setFocused] = useState(null),
    collection = useCollection(`/api/${type}`, {
      project,
      year,
      search,
      sort,
      trash,
    }),
    canWrite = hasRole("Manager");
  useEffect(() => {
    api
      .get("/api/files/counts", { params: { entityType: type, project } })
      .then(({ data }) => setCounts(data.data))
      .catch(() => {});
  }, [type, project, collection.rows]);
  useEffect(() => {
    if (!project)
      projectOptions()
        .then(({ data }) => setProjects(data.data))
        .catch(() => {});
  }, [project]);
  useEffect(() => {
    const id = params.get("record");
    if (id)
      api
        .get(`/api/${type}/${id}`)
        .then(({ data }) => setFocused(data))
        .catch((e) => setError(apiMessage(e)));
  }, [type, params]);
  const create = () => {
    setEditing(null);
    setError("");
    setForm({
      ...base,
      project: project || "",
      status: type === "orders" ? "todo" : "draft",
      [conf.date]: new Date().toISOString().slice(0, 10),
    });
    setOpen(true);
  };
  const edit = (item) => {
    setEditing(item.id);
    setError("");
    const next = { ...base, ...item, project: idOf(item.project) };
    for (const k of ["signedAt", "date", "issuedAt", "closedAt"])
      next[k] = next[k]?.slice(0, 10) || "";
    setForm(next);
    setOpen(true);
  };
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api[editing ? "patch" : "post"](
        editing ? `/api/${type}/${editing}` : `/api/${type}`,
        form,
      );
      setOpen(false);
      setEditing(null);
      setForm(base);
      collection.reload();
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const archiveItem = async () => {
    setBusy(true);
    try {
      await api.delete(`/api/${type}/${remove.id}`);
      setRemove(null);
      collection.reload();
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const exportXlsx = async () => {
    setBusy(true);
    try {
      const { data } = await api.get(
          `/api/export/projects/${project}/${type}`,
          { responseType: "blob" },
        ),
        url = URL.createObjectURL(data),
        a = document.createElement("a");
      a.href = url;
      a.download = `${type}.xlsx`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const fileButtons = (item) => (
    <div className="file-type-pair">
      {["pdf", "doc"].map((extension) => (
        <button
          key={extension}
          className={`file-type-button ${counts[item.id]?.extensions?.[extension] ? "uploaded" : ""}`}
          onClick={() => setArchive({ ...item, extension })}
        >
          {counts[item.id]?.extensions?.[extension] ? "Yuklandi" : "Yuklash"}
          <small>{extension.toUpperCase()}</small>
        </button>
      ))}
    </div>
  );
  let columns =
    type === "expenses"
      ? [
          "№",
          "Sana",
          "Nomi",
          "Dog summa",
          "Avans",
          "Jami berilgan summa",
          "Yopildi",
          "",
        ]
      : type === "contracts"
        ? [
            "№",
            "Sana",
            "Nomi",
            "Buyurtmachi ismi",
            "Tel raqam",
            "Dog summa",
            "Avans",
            "Jami berilgan summa",
            "Yopildi",
            "Yuklash",
            "",
          ]
        : type === "letters"
          ? [
              "№",
              "Sana",
              "Nomi",
              "Buyurtmachi ismi",
              "Tel raqam",
              "Dog summa",
              "Yuklash",
              "",
            ]
          : ["Sana", "Nomi", "Buyurtmachi ismi", "Tel raqam", "Yuklash", ""];
  return (
    <div>
      {conf.finance && !hasRole("Manager") ? (
        <Notice error="Bu bo'lim uchun ruxsat yo'q" />
      ) : (
        <>
          <div className="page-heading">
            {!embedded && <h1>{conf.title}</h1>}
            <div className="heading-actions">
              {!embedded && <YearFilter value={year} onChange={setYear} />}
              <Button
                variant="secondary"
                onClick={() => setSort((v) => (v === "asc" ? "desc" : "asc"))}
              >
                Sana {sort === "asc" ? "↑" : "↓"}
              </Button>
              {project && conf.finance && (
                <Button disabled={busy} onClick={exportXlsx}>
                  xls.Fayl
                </Button>
              )}
              {canWrite && !trash && <Button onClick={create}>Yangi</Button>}
            </div>
          </div>
          <div className="filter-bar">
            <input
              aria-label={`${conf.title} qidirish`}
              placeholder="Qidirish"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {canWrite && (
              <Button variant="ghost" onClick={() => setTrash((v) => !v)}>
                {trash ? "Faol yozuvlar" : "Arxiv"}
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
              columns={columns}
              rows={collection.rows}
              empty={`${conf.title} hali yo'q`}
              renderRow={(item, i) => (
                <tr key={item.id} className={i === 0 ? "selected" : ""}>
                  {type !== "orders" && (
                    <td>{(collection.page - 1) * 20 + i + 1}</td>
                  )}
                  <td className="whitespace-nowrap">
                    {dateLabel(item[conf.date] || item.createdAt)}
                  </td>
                  <td>
                    <button
                      className="text-left"
                      onClick={() => setFocused(item)}
                    >
                      {item.title}
                    </button>
                  </td>
                  {type !== "expenses" && (
                    <>
                      <td>{item.customerName || "—"}</td>
                      <td>{item.customerPhone || "—"}</td>
                    </>
                  )}
                  {type !== "orders" && (
                    <td className="whitespace-nowrap">
                      {amountLabel(item.amount)}
                    </td>
                  )}
                  {conf.finance && (
                    <>
                      <td>{amountLabel(item.advance)}</td>
                      <td>{amountLabel(item.totalPaid)}</td>
                      <td>{dateLabel(item.closedAt)}</td>
                    </>
                  )}
                  {type !== "expenses" && (
                    <td>{!trash && fileButtons(item)}</td>
                  )}
                  <td>
                    <RowActions
                      onEdit={canWrite && !trash ? () => edit(item) : null}
                      onArchive={
                        canWrite && !trash ? () => setRemove(item) : null
                      }
                      onRestore={
                        canWrite && trash
                          ? async () => {
                              try {
                                await api.post(
                                  `/api/${type}/${item.id}/restore`,
                                );
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
        </>
      )}
      <Modal
        open={open}
        title={`${conf.singular} ${editing ? "tahrirlash" : "yaratish"}`}
        onClose={() => setOpen(false)}
      >
        <form className="form-grid" onSubmit={submit}>
          <Notice error={error} />
          <Input
            label="Nomi"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          {!project && (
            <Select
              label="Loyiha"
              disabled={!!editing}
              value={form.project}
              onChange={(e) => setForm({ ...form, project: e.target.value })}
            >
              <option value="">Tanlang</option>
              {projects.map((p) => (
                <option value={p.id} key={p.id}>
                  {p.title}
                </option>
              ))}
            </Select>
          )}
          <Input
            label="Sana"
            type="date"
            value={form[conf.date]}
            onChange={(e) => setForm({ ...form, [conf.date]: e.target.value })}
          />
          {type !== "expenses" && (
            <div className="form-columns">
              <Input
                label="Buyurtmachi ismi"
                value={form.customerName}
                onChange={(e) =>
                  setForm({ ...form, customerName: e.target.value })
                }
              />
              <Input
                label="Tel raqam"
                value={form.customerPhone}
                onChange={(e) =>
                  setForm({ ...form, customerPhone: e.target.value })
                }
              />
            </div>
          )}
          {type !== "orders" && (
            <Input
              label="Dog summa"
              min="0"
              step="0.01"
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          )}
          {conf.finance && (
            <>
              <div className="form-columns">
                <Input
                  label="Avans"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.advance}
                  onChange={(e) =>
                    setForm({ ...form, advance: e.target.value })
                  }
                />
                <Input
                  label="Jami berilgan summa"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.totalPaid}
                  onChange={(e) =>
                    setForm({ ...form, totalPaid: e.target.value })
                  }
                />
              </div>
              <Input
                label="Yopildi"
                type="date"
                value={form.closedAt}
                onChange={(e) => setForm({ ...form, closedAt: e.target.value })}
              />
            </>
          )}
          {type === "contracts" && (
            <Input
              label="Shartnoma raqami"
              value={form.contractNumber}
              onChange={(e) =>
                setForm({ ...form, contractNumber: e.target.value })
              }
            />
          )}
          <Textarea
            label="Izoh"
            value={type === "orders" ? form.description : form.notes}
            onChange={(e) =>
              setForm({
                ...form,
                [type === "orders" ? "description" : "notes"]: e.target.value,
              })
            }
          />
          <Button type="submit" disabled={busy}>
            Saqlash
          </Button>
        </form>
      </Modal>
      <Modal
        open={!!focused}
        title={focused?.title || "Ma'lumot"}
        onClose={() => setFocused(null)}
      >
        <div className="space-y-4">
          <p>
            {focused?.customerName} {focused?.customerPhone}
          </p>
          <p>{focused?.notes || focused?.description}</p>
          <p>{dateLabel(focused?.[conf.date])}</p>
          {conf.finance && (
            <p>
              Dog summa: {amountLabel(focused?.amount)} · Avans:{" "}
              {amountLabel(focused?.advance)}
            </p>
          )}
          {canWrite && (
            <Button
              onClick={() => {
                edit(focused);
                setFocused(null);
              }}
            >
              Tahrirlash
            </Button>
          )}
        </div>
      </Modal>
      <ConfirmAction
        open={!!remove}
        busy={busy}
        onClose={() => setRemove(null)}
        onConfirm={archiveItem}
      />
      <FileArchiveModal
        open={!!archive}
        onClose={() => {
          setArchive(null);
          collection.reload();
        }}
        title={`${archive?.title || ""} · ${archive?.extension?.toUpperCase() || ""}`}
        entityType={type}
        entityId={archive?.id}
        project={project || idOf(archive?.project)}
        kind={conf.kind || "document"}
        extension={archive?.extension}
      />
    </div>
  );
}
