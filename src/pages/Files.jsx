import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { api, apiMessage } from "../api/client";
import { Table } from "../components/Table";
import { RecordPreview } from "../components/RecordPreview";
import { Button } from "../components/Button";
import {
  Notice,
  Pagination,
  RowActions,
  ConfirmAction,
} from "../components/Workspace";
import { useCollection, downloadFile, dateLabel } from "../api/workspace";
export default function Files() {
  const [params, setParams] = useSearchParams(),
    [viewing, setViewing] = useState(null),
    [search, setSearch] = useState(""),
    [trash, setTrash] = useState(false),
    [error, setError] = useState(""),
    [remove, setRemove] = useState(null),
    [busy, setBusy] = useState(false),
    c = useCollection("/api/files", {
      search,
      trash,
      id: params.get("file") || undefined,
    });
  const fileId = params.get("file");
  useEffect(() => {
    if (!fileId) return;
    const controller = new AbortController();
    setSearch("");
    api
      .get(`/api/files/${fileId}`, { signal: controller.signal })
      .then(({ data }) => setViewing(data))
      .catch((e) => {
        if (e.code !== "ERR_CANCELED") setError(apiMessage(e));
      });
    return () => controller.abort();
  }, [fileId]);
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
      await api.delete(`/api/files/${remove.id}`);
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
        <h1>Loyiha fayllari</h1>
        <Button variant="secondary" onClick={() => setTrash((v) => !v)}>
          {trash ? "Faol fayllar" : "Arxiv"}
        </Button>
      </div>
      <p className="mb-5 text-gray-500">
        Fayl yuklash uchun loyiha yoki hujjatning fayllar bo'limini oching.
      </p>
      <div className="filter-bar">
        <input
          placeholder="Fayl nomi"
          aria-label="Fayl qidirish"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <Notice error={error || c.error} loading={c.loading} onRetry={c.reload} />
      {!c.loading && (
        <Table
          columns={["Nomi", "Tur", "Hajm", "Sana", "Yuklash", ""]}
          rows={c.rows}
          renderRow={(f) => (
            <tr
              key={f.id}
              className={f.id === params.get("file") ? "selected" : ""}
            >
              <td>
                <button className="record-link" onClick={() => setViewing(f)}>
                  {f.originalName}
                </button>
                {f.project && (
                  <Link
                    className="block text-xs opacity-60"
                    to={`/projects/${f.project}`}
                  >
                    Loyihani ochish
                  </Link>
                )}
              </td>
              <td>{f.extension}</td>
              <td>{(f.size / 1024 / 1024).toFixed(2)} MB</td>
              <td>{dateLabel(f.createdAt)}</td>
              <td>
                {!trash && (
                  <button
                    className="file-type-button"
                    onClick={() =>
                      downloadFile(f).catch((e) => setError(apiMessage(e)))
                    }
                  >
                    Yuklab olish
                  </button>
                )}
              </td>
              <td>
                <RowActions
                  onArchive={
                    !trash
                      ? () => {
                          setError("");
                          setRemove(f);
                        }
                      : null
                  }
                  onRestore={
                    trash
                      ? async () => {
                          try {
                            await api.post(`/api/files/${f.id}/restore`);
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
      )}
      <Pagination {...c} onChange={c.setPage} />
      <RecordPreview
        item={viewing}
        onClose={closePreview}
        fields={[
          ["Tur", viewing?.extension?.toUpperCase()],
          [
            "Hajm",
            viewing ? `${(viewing.size / 1024 / 1024).toFixed(2)} MB` : null,
          ],
          ["Sana", viewing?.createdAt ? dateLabel(viewing.createdAt) : null],
        ]}
        onDownload={
          viewing
            ? () => downloadFile(viewing).catch((e) => setError(apiMessage(e)))
            : undefined
        }
      />
      <ConfirmAction
        itemLabel={remove?.title || remove?.originalName}
        error={error}
        open={!!remove}
        busy={busy}
        onClose={() => {
          setError("");
          setRemove(null);
        }}
        onConfirm={archive}
      />
    </div>
  );
}
