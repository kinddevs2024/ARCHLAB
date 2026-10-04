import { Meter, Feedback } from "./DesignSystem";
import { Action } from "./Button";
import { FileBackupStatus } from "./FileBackupStatus";
import { useEffect, useRef, useState } from "react";
import { api, apiMessage } from "../api/client";
import { Button } from "./Button";
import { Modal } from "./Modal";
import { Pagination, Notice, RowActions, ConfirmAction } from "./Workspace";
import { useCollection, downloadFile } from "../api/workspace";
export function FileArchiveModal(props) {
  const saved = useRef(props),
    [present, setPresent] = useState(props.open);
  if (props.open && props.entityId) saved.current = props;
  useEffect(() => {
    if (props.open) {
      setPresent(true);
      return;
    }
    const timer = setTimeout(() => setPresent(false), 180);
    return () => clearTimeout(timer);
  }, [props.open]);
  if (!props.open && !present) return null;
  const data = props.open ? props : saved.current;
  return data.entityId ? (
    <ArchiveContent
      key={`${data.entityType}-${data.entityId}-${data.extension || ""}`}
      {...data}
      open={props.open}
      onClose={props.onClose}
    />
  ) : null;
}
function ArchiveContent({
  open,
  onClose,
  title,
  entityType,
  entityId,
  kind,
  section,
  project,
  folder,
  extension,
}) {
  const input = useRef(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [progress, setProgress] = useState(null),
    [success, setSuccess] = useState(""),
    [remove, setRemove] = useState(null),
    [trash, setTrash] = useState(false),
    [capabilities, setCapabilities] = useState(null),
    collection = useCollection("/api/files", {
      entityType,
      entityId,
      section,
      trash,
      extension,
    });
  useEffect(() => {
    if (
      !open ||
      !collection.rows.some((f) => f.storage && f.storage.status !== "synced")
    )
      return;
    const timer = setInterval(collection.reload, 15000);
    return () => clearInterval(timer);
  }, [open, collection.rows, collection.reload]);
  useEffect(() => {
    if (open)
      api
        .get("/api/storage/capabilities")
        .then(({ data }) => setCapabilities(data))
        .catch(() => {});
  }, [open]);
  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError("");
    setSuccess("");
    setProgress(0);
    const data = new FormData();
    for (const [key, value] of Object.entries({
      entityType,
      entityId,
      kind,
      section,
      project,
      folder,
    }))
      if (value) data.append(key, value);
    data.append("file", file);
    try {
      await api.post("/api/files", data, {
        onUploadProgress: (event) => {
          if (event.total)
            setProgress(
              Math.min(100, Math.round((event.loaded / event.total) * 100)),
            );
        },
      });
      setSuccess("Fayl saqlandi");
      collection.reload();
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      setBusy(false);
      setProgress(null);
      if (input.current) input.current.value = "";
    }
  };
  const action = async () => {
    setBusy(true);
    try {
      await api.delete(`/api/files/${remove.id}`);
      setRemove(null);
      collection.reload();
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      open={open}
      title={title || "Fayllar"}
      onClose={onClose}
      size="wide"
      dismissible={!busy}
    >
      <div className="mb-5 flex flex-wrap justify-between gap-3">
        <Button variant="ghost" onClick={() => setTrash((v) => !v)}>
          {trash ? "Faol fayllar" : "Arxiv"}
        </Button>
        {!trash && (
          <Button disabled={busy} onClick={() => input.current.click()}>
            {busy ? "Yuklanmoqda..." : "Fayl yuklash"}
          </Button>
        )}
        <input
          ref={input}
          type="file"
          hidden
          onChange={upload}
          accept={
            extension
              ? extension === "pdf"
                ? ".pdf"
                : ".doc,.docx"
              : undefined
          }
        />
      </div>
      {capabilities?.enabled && project && (
        <p className="text-gray-500 mb-3 text-xs">
          Fayl avval serverda saqlanadi, keyin zaxiralanadi. Maksimum:{" "}
          {capabilities.maxFileSizeMb} MB.
        </p>
      )}
      {progress !== null && (
        <div className="upload-progress" role="status">
          <p>Fayl yuklanmoqda · {progress}%</p>
          <Meter value={progress} label="Fayl yuklanishi" />
        </div>
      )}
      {success && <Feedback kind="success">{success}</Feedback>}
      <Notice
        error={error || collection.error}
        loading={collection.loading}
        onRetry={collection.reload}
      />
      {!collection.loading && (
        <div className="divide-y divide-gray-100">
          {collection.rows.map((file) => (
            <div
              key={file.id}
              className="flex flex-wrap items-center justify-between gap-3 py-4"
            >
              <div className="min-w-0 max-w-full">
                <p className="break-all font-semibold">{file.originalName}</p>
                <FileBackupStatus file={file} />
                <small className="text-gray-400">
                  {file.extension} · {(file.size / 1024 / 1024).toFixed(2)} MB
                </small>
              </div>
              <div className="flex items-center gap-4">
                {!trash && (
                  <Action
                    className="file-type-button"
                    onClick={() =>
                      downloadFile(file).catch((e) => setError(apiMessage(e)))
                    }
                  >
                    Yuklab olish
                  </Action>
                )}
                <RowActions
                  onArchive={
                    !trash
                      ? () => {
                          setError("");
                          setRemove(file);
                        }
                      : null
                  }
                  onRestore={
                    trash
                      ? async () => {
                          try {
                            await api.post(`/api/files/${file.id}/restore`);
                            collection.reload();
                          } catch (e) {
                            setError(apiMessage(e));
                          }
                        }
                      : null
                  }
                />
              </div>
            </div>
          ))}
          {!collection.rows.length && (
            <p className="py-8 text-center text-gray-400">
              Fayllar hali yuklanmagan
            </p>
          )}
        </div>
      )}
      <Pagination {...collection} onChange={collection.setPage} />
      <ConfirmAction
        itemLabel={remove?.title || remove?.originalName}
        error={error}
        open={!!remove}
        busy={busy}
        onClose={() => {
          setError("");
          setRemove(null);
        }}
        onConfirm={action}
      />
    </Modal>
  );
}
