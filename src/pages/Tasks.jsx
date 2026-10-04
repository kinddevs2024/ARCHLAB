import { Surface, Title } from "../components/DesignSystem";
import { Field } from "../components/Input";
import { Action } from "../components/Button";
import { projectOptions } from "../api/options";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, apiMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Input, Select, Textarea } from "../components/Input";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { Table } from "../components/Table";
import { RecordPreview } from "../components/RecordPreview";
import { StatusBadge } from "../components/StatusBadge";
import {
  Pagination,
  Notice,
  RowActions,
  ConfirmAction,
} from "../components/Workspace";
import { useCollection, dateLabel, idOf } from "../api/workspace";
import assets from "../figma-assets.json";
const empty = {
  title: "",
  description: "",
  priority: "normal",
  dueDate: "",
  project: "",
  assignee: "",
  status: "todo",
};
export default function Tasks() {
  const { hasRole } = useAuth(),
    [params, setParams] = useSearchParams(),
    [viewing, setViewing] = useState(null),
    [search, setSearch] = useState(""),
    [status, setStatus] = useState(""),
    [trash, setTrash] = useState(false),
    [open, setOpen] = useState(false),
    [editing, setEditing] = useState(null),
    [form, setForm] = useState(empty),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [remove, setRemove] = useState(null),
    [people, setPeople] = useState([]),
    [projects, setProjects] = useState([]),
    c = useCollection("/api/tasks", { search, status, trash });
  useEffect(() => {
    api
      .get("/api/users/directory")
      .then(({ data }) => setPeople(data.data))
      .catch(() => {});
    projectOptions()
      .then(({ data }) => setProjects(data.data))
      .catch(() => {});
  }, []);
  const selectedProject = projects.find((p) => p.id === form.project);
  const assignees = people.filter(
    (u) =>
      !form.project ||
      ["Owner", "Admin"].includes(u.status) ||
      [
        ...(selectedProject?.assignedTo || []),
        selectedProject?.helper,
        selectedProject?.master,
      ]
        .filter(Boolean)
        .some((id) => idOf(id) === u.id),
  );
  const edit = (item) => {
    setEditing(item?.id || null);
    setForm(
      item
        ? {
            ...empty,
            ...item,
            dueDate: item.dueDate?.slice(0, 10) || "",
            project: idOf(item.project),
            assignee: idOf(item.assignee),
          }
        : empty,
    );
    setError("");
    setOpen(true);
  };
  const recordId = params.get("record");
  useEffect(() => {
    if (!recordId) return;
    const controller = new AbortController();
    api
      .get(`/api/tasks/${recordId}`, { signal: controller.signal })
      .then(({ data }) => setViewing(data))
      .catch((e) => {
        if (e.code !== "ERR_CANCELED") setError(apiMessage(e));
      });
    return () => controller.abort();
  }, [recordId]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const data = hasRole("Manager") ? form : { status: form.status };
      await api[editing ? "patch" : "post"](
        editing ? `/api/tasks/${editing}` : "/api/tasks",
        data,
      );
      setOpen(false);
      c.reload();
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const closePreview = () => {
    setViewing(null);
    const next = new URLSearchParams(params);
    next.delete("record");
    next.delete("file");
    setParams(next, { replace: true });
  };
  const archive = async () => {
    setBusy(true);
    try {
      await api.delete(`/api/tasks/${remove.id}`);
      setRemove(null);
      c.reload();
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      <div className="page-heading">
        <div>
          <Title>Vazifalar</Title>
          <p className="mt-3 text-gray-500">
            Sizning ish joyingizdagi vazifalar.
          </p>
        </div>
        {hasRole("Manager") && !trash && (
          <Button onClick={() => edit(null)}>Vazifa yaratish</Button>
        )}
      </div>
      <Surface className="filter-bar">
        <Field
          aria-label="Vazifa qidirish"
          placeholder="Qidirish"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          aria-label="Vazifa holati"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">Barcha status</option>
          <option value="todo">Yangi</option>
          <option value="in_progress">Jarayonda</option>
          <option value="done">Tayyorlandi</option>
        </Select>
        {hasRole("Manager") && (
          <Button variant="ghost" onClick={() => setTrash((v) => !v)}>
            {trash ? "Faol vazifalar" : "Arxiv"}
          </Button>
        )}
      </Surface>
      <Notice
        error={!open ? error || c.error : c.error}
        loading={c.loading}
        onRetry={c.reload}
      />
      {!c.loading && !c.rows.length && !c.error ? (
        <Surface className="empty-state">
          <img
            src={assets["task-form"].imgGroup43}
            alt=""
            className="mx-auto max-w-none"
          />
          <h2>Vazifalar hali yo'q</h2>
          <p>
            Ish joyingizda hali vazifa yaratilmagan. Ishni boshlash uchun yangi
            vazifa yarating.
          </p>
          {hasRole("Manager") && (
            <Button onClick={() => edit(null)}>Vazifa yaratish</Button>
          )}
        </Surface>
      ) : (
        !c.loading && (
          <Table
            columns={[
              "Vazifa",
              "Loyiha",
              "Mas'ul",
              "Ustuvorlik",
              "Tugatish sanasi",
              "Status",
              "",
            ]}
            rows={c.rows}
            renderRow={(item) => (
              <tr key={item.id} className="data-row">
                <td>
                  <Action
                    className="record-link"
                    onClick={() => setViewing(item)}
                  >
                    {item.title}
                  </Action>
                </td>
                <td>{item.project?.title || "—"}</td>
                <td>{item.assignee?.name || "—"}</td>
                <td>{item.priority}</td>
                <td>{dateLabel(item.dueDate)}</td>
                <td>
                  <StatusBadge value={item.status} />
                </td>
                <td>
                  <RowActions
                    onEdit={!trash ? () => edit(item) : null}
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
                              await api.post(`/api/tasks/${item.id}/restore`);
                              c.reload();
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
        )
      )}
      <Pagination {...c} onChange={c.setPage} />
      <RecordPreview
        item={viewing}
        onClose={closePreview}
        fields={[
          ["Loyiha", viewing?.project?.title],
          [
            "Mas'ul",
            [viewing?.assignee?.name, viewing?.assignee?.surname]
              .filter(Boolean)
              .join(" "),
          ],
          ["Ustuvorlik", viewing?.priority],
          [
            "Tugatish sanasi",
            viewing?.dueDate ? dateLabel(viewing.dueDate) : null,
          ],
          ["Izoh", viewing?.description],
        ]}
        onEdit={
          !trash
            ? () => {
                const item = viewing;
                closePreview();
                edit(item);
              }
            : undefined
        }
      />
      <Modal
        open={open}
        dismissible={!busy}
        title={editing ? "Vazifani tahrirlash" : "Vazifa yaratish"}
        onClose={() => setOpen(false)}
      >
        <form className="form-grid" onSubmit={submit}>
          <Notice error={error} />
          <Input
            label="Vazifa nomi"
            required
            disabled={!hasRole("Manager")}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          {hasRole("Manager") && (
            <>
              <div className="form-columns">
                <Select
                  label="Vazifa ustuvorligi"
                  value={form.priority}
                  onChange={(e) =>
                    setForm({ ...form, priority: e.target.value })
                  }
                >
                  <option value="low">Kamroq muhim</option>
                  <option value="normal">Normal</option>
                  <option value="high">Juda muhim</option>
                </Select>
                <Input
                  label="Tugatish sanasi"
                  type="date"
                  value={form.dueDate}
                  onChange={(e) =>
                    setForm({ ...form, dueDate: e.target.value })
                  }
                />
              </div>
              <Textarea
                label="Vazifa tavsifi"
                placeholder="Kontentingizni shu yerda chop eting...."
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
              <div className="form-columns">
                <Select
                  label="Loyiha"
                  disabled={!!editing}
                  value={form.project}
                  onChange={(e) =>
                    setForm({ ...form, project: e.target.value, assignee: "" })
                  }
                >
                  <option value="">Tanlang</option>
                  {projects.map((p) => (
                    <option value={p.id} key={p.id}>
                      {p.title}
                    </option>
                  ))}
                </Select>
                <Select
                  label="Mas'ul xodim"
                  value={form.assignee}
                  onChange={(e) =>
                    setForm({ ...form, assignee: e.target.value })
                  }
                >
                  <option value="">Tanlang</option>
                  {assignees.map((u) => (
                    <option value={u.id} key={u.id}>
                      {u.name} {u.surname}
                    </option>
                  ))}
                </Select>
              </div>
            </>
          )}
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value="todo">Yangi</option>
            <option value="in_progress">Jarayonda</option>
            <option value="done">Tayyorlandi</option>
          </Select>
          <Button
            type="submit"
            disabled={busy}
            className="justify-self-start h-[57px]"
          >
            {editing ? "Saqlash" : "Vazifa yaratish"}
          </Button>
        </form>
      </Modal>
      <ConfirmAction
        itemLabel={remove?.title || remove?.originalName}
        error={error}
        open={!!remove}
        onClose={() => {
          setError("");
          setRemove(null);
        }}
        onConfirm={archive}
        busy={busy}
      />
    </div>
  );
}
