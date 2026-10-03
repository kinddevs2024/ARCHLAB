import { useRef, useState } from "react";
import { api, apiMessage } from "../api/client";
import { Button } from "./Button";
import { Modal } from "./Modal";
import { Pagination, Notice, RowActions, ConfirmAction } from "./Workspace";
import { useCollection, downloadFile } from "../api/workspace";
export function FileArchiveModal({
  open,
  onClose,
  title,
  entityType,
  entityId,
  kind = "document",
  section = "archive",
  project,
  folder,
  extension,
}) {
  return open && entityId ? (
    <ArchiveContent
      {...{
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
      }}
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
    [remove, setRemove] = useState(null),
    [trash, setTrash] = useState(false),
    collection = useCollection("/api/files", {
      entityType,
      entityId,
      section,
      trash,
      extension,
    });
  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError("");
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
      await api.post("/api/files", data);
      collection.reload();
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      setBusy(false);
      input.current.value = "";
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
    <Modal open={open} title={title || "Fayllar"} onClose={onClose} size="wide">
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
                <small className="text-gray-400">
                  {file.extension} · {(file.size / 1024 / 1024).toFixed(2)} MB
                </small>
              </div>
              <div className="flex items-center gap-4">
                {!trash && (
                  <button
                    className="file-type-button"
                    onClick={() =>
                      downloadFile(file).catch((e) => setError(apiMessage(e)))
                    }
                  >
                    Yuklab olish
                  </button>
                )}
                <RowActions
                  onArchive={!trash ? () => setRemove(file) : null}
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
        open={!!remove}
        busy={busy}
        onClose={() => setRemove(null)}
        onConfirm={action}
      />
    </Modal>
  );
}
