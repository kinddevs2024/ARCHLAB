import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, apiMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/Button";
import { Input, Select, Textarea } from "../components/Input";
import { Modal } from "../components/Modal";
import { Table } from "../components/Table";
import { StatusBadge } from "../components/StatusBadge";
import { FileArchiveModal } from "../components/FileArchiveModal";
import {
  Notice,
  Pagination,
  FigmaIcon,
  RowActions,
  ConfirmAction,
} from "../components/Workspace";
import { useCollection, dateLabel } from "../api/workspace";
import Documents from "./Documents";
const defaults = [
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
export default function ProjectDetail() {
  const { id, folderId } = useParams(),
    navigate = useNavigate(),
    { hasRole } = useAuth(),
    [project, setProject] = useState(null),
    [parent, setParent] = useState(null),
    [tab, setTab] = useState("folders"),
    [open, setOpen] = useState(false),
    [editing, setEditing] = useState(null),
    [form, setForm] = useState({
      title: "",
      status: "new",
      description: "",
      contactPhone: "",
    }),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [remove, setRemove] = useState(null),
    [archive, setArchive] = useState(null),
    [trash, setTrash] = useState(false),
    folders = useCollection("/api/project-folders", {
      project: id,
      parent: folderId,
      trash,
    });
  useEffect(() => {
    setTab("folders");
    setTrash(false);
    api
      .get(`/api/projects/${id}`)
      .then(({ data }) => setProject(data))
      .catch((e) => setError(apiMessage(e)));
    if (folderId)
      api
        .get(`/api/project-folders/${folderId}`)
        .then(({ data }) => setParent(data))
        .catch((e) => setError(apiMessage(e)));
    else setParent(null);
  }, [id, folderId]);
  const create = () => {
    setEditing(null);
    setForm({ title: "", status: "new", description: "", contactPhone: "" });
    setError("");
    setOpen(true);
  };
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api[editing ? "patch" : "post"](
        editing ? `/api/project-folders/${editing}` : "/api/project-folders",
        { ...form, ...(!editing ? { project: id, parent: folderId } : {}) },
      );
      setOpen(false);
      folders.reload();
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const archiveFolder = async () => {
    setBusy(true);
    try {
      await api.delete(`/api/project-folders/${remove.id}`);
      setRemove(null);
      folders.reload();
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const defaultFolders = async () => {
    setBusy(true);
    try {
      await api.post("/api/project-folders/defaults", {
        project: id,
        titles: defaults,
      });
      folders.reload();
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      <nav className="breadcrumb">
        <Link to="/projects">Loyihalar</Link>
        <span>›</span>
        {folderId ? (
          <>
            <Link to={`/projects/${id}`}>{project?.title || "Loyiha"}</Link>
            <span>›</span>
            <span>{parent?.title}</span>
          </>
        ) : (
          <span>{project?.title}</span>
        )}
      </nav>
      <div className="page-heading">
        <h1>{folderId ? parent?.title : project?.title || "Loyiha"}</h1>
        {tab === "folders" && (
          <div className="heading-actions">
            <Button
              onClick={() =>
                setArchive({
                  entityType: folderId ? "project-folders" : "projects",
                  entityId: folderId || id,
                  title: parent?.title || project?.title,
                })
              }
            >
              Yuklash
            </Button>
            {hasRole("Manager") && !trash && (
              <Button onClick={create}>Yangi</Button>
            )}
          </div>
        )}
      </div>
      {!folderId && hasRole("Manager") && (
        <div className="tabs">
          <button
            className={tab === "folders" ? "active" : ""}
            onClick={() => setTab("folders")}
          >
            Papkalar
          </button>
          <button
            className={tab === "contracts" ? "active" : ""}
            onClick={() => setTab("contracts")}
          >
            Shartnoma
          </button>
          <button
            className={tab === "expenses" ? "active" : ""}
            onClick={() => setTab("expenses")}
          >
            Xarajatlar
          </button>
        </div>
      )}
      {tab !== "folders" ? (
        <Documents type={tab} project={id} embedded />
      ) : (
        <>
          <div className="filter-bar">
            {hasRole("Manager") && (
              <Button variant="ghost" onClick={() => setTrash((v) => !v)}>
                {trash ? "Faol papkalar" : "Arxiv"}
              </Button>
            )}
            {!folderId &&
              !trash &&
              !folders.rows.length &&
              !folders.loading &&
              hasRole("Manager") && (
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={defaultFolders}
                >
                  Standart papkalar
                </Button>
              )}
          </div>
          <Notice
            error={error || folders.error}
            loading={folders.loading}
            onRetry={folders.reload}
          />
          {!folders.loading && (
            <Table
              columns={
                folderId
                  ? [
                      "Eskiz",
                      "Tel raqam",
                      "Sana",
                      "Tahrirlash",
                      "O'chirish",
                      "Yuklash",
                    ]
                  : [
                      "",
                      "Papkalar",
                      "Sana",
                      "Yuklash",
                      "Tahrirlash",
                      "O'chirish",
                    ]
              }
              rows={folders.rows}
              empty="Bu papka ichida papkalar hali yo'q"
              renderRow={(folder, i) => (
                <tr key={folder.id} className={i === 0 ? "selected" : ""}>
                  {!folderId && (
                    <td>
                      <StatusBadge value={folder.status} />
                    </td>
                  )}
                  <td>
                    <button
                      className="folder-name"
                      disabled={trash}
                      onClick={() =>
                        navigate(`/projects/${id}/folders/${folder.id}`)
                      }
                    >
                      <span>›</span>
                      <FigmaIcon
                        name={i === 0 ? "imgFoldrIcon" : "imgFolderIcon"}
                      />
                      {folder.title}
                    </button>
                  </td>
                  {folderId && (
                    <td>
                      {folder.contactPhone || project?.customerPhone || "—"}
                    </td>
                  )}
                  <td>{dateLabel(folder.date)}</td>
                  {!folderId && (
                    <td>
                      <button
                        className="file-type-button"
                        onClick={() =>
                          setArchive({
                            entityType: "project-folders",
                            entityId: folder.id,
                            title: folder.title,
                            folder: folder.id,
                          })
                        }
                      >
                        Yuklash
                      </button>
                    </td>
                  )}
                  <td>
                    <RowActions
                      onEdit={
                        !trash && hasRole("Manager")
                          ? () => {
                              setEditing(folder.id);
                              setForm({
                                title: folder.title,
                                status: folder.status,
                                description: folder.description || "",
                                contactPhone: folder.contactPhone || "",
                              });
                              setError("");
                              setOpen(true);
                            }
                          : null
                      }
                    />
                  </td>
                  <td>
                    <RowActions
                      onArchive={
                        !trash && hasRole("Manager")
                          ? () => setRemove(folder)
                          : null
                      }
                      onRestore={
                        trash
                          ? async () => {
                              try {
                                await api.post(
                                  `/api/project-folders/${folder.id}/restore`,
                                );
                                folders.reload();
                              } catch (e) {
                                setError(apiMessage(e));
                              }
                            }
                          : null
                      }
                    />
                  </td>
                  {folderId && (
                    <td>
                      <button
                        className="file-type-button"
                        onClick={() =>
                          setArchive({
                            entityType: "project-folders",
                            entityId: folder.id,
                            title: folder.title,
                            folder: folder.id,
                          })
                        }
                      >
                        Yuklash
                      </button>
                    </td>
                  )}
                </tr>
              )}
            />
          )}
          <Pagination {...folders} onChange={folders.setPage} />
          <FilesInFolder project={id} folder={folderId} />
        </>
      )}
      <Modal
        open={open}
        title={editing ? "Papkani tahrirlash" : "Papka yaratish"}
        onClose={() => setOpen(false)}
      >
        <form className="form-grid" onSubmit={submit}>
          <Notice error={error} />
          <Input
            label={folderId ? "Eskiz nomi" : "Papka nomi"}
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <Input
            label="Tel raqam"
            value={form.contactPhone}
            onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
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
          <Textarea
            label="Izoh"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <Button type="submit" disabled={busy}>
            Saqlash
          </Button>
        </form>
      </Modal>
      <ConfirmAction
        open={!!remove}
        busy={busy}
        onClose={() => setRemove(null)}
        onConfirm={archiveFolder}
      />
      <FileArchiveModal
        open={!!archive}
        onClose={() => setArchive(null)}
        {...archive}
        project={id}
        kind="project"
      />
    </div>
  );
}
function FilesInFolder({ project, folder }) {
  const [open, setOpen] = useState(false),
    collection = useCollection("/api/files", {
      entityType: folder ? "project-folders" : "projects",
      entityId: folder || project,
    });
  return (
    <div className="mt-8">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Fayllar</h2>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Fayllarni boshqarish{" "}
          {collection.meta?.total ? `(${collection.meta.total})` : ""}
        </Button>
      </div>
      <Notice error={collection.error} />
      <FileArchiveModal
        open={open}
        onClose={() => {
          setOpen(false);
          collection.reload();
        }}
        entityType={folder ? "project-folders" : "projects"}
        entityId={folder || project}
        folder={folder}
        project={project}
        kind="project"
      />
    </div>
  );
}
