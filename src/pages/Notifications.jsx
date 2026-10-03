import { Link } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { api, apiMessage } from "../api/client";
import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get(
        `/api/notifications?page=${page}&limit=20`,
      );
      setItems(data.data);
      setMeta(data.meta);
    } catch (err) {
      setError(apiMessage(err, "Bildirishnomalarni yuklashda xatolik"));
    } finally {
      setLoading(false);
    }
  }, [page]);
  useEffect(() => {
    load();
  }, [load]);
  const markRead = async (id) => {
    try {
      await api.patch(
        id ? `/api/notifications/${id}/read` : "/api/notifications/read-all",
      );
      await load();
      window.dispatchEvent(new Event("notifications:changed"));
    } catch (err) {
      setError(apiMessage(err, "Saqlashda xatolik"));
    }
  };
  return (
    <div>
      <div className="page-heading">
        <h1 className="text-[32px] font-semibold">Bildirishnomalar</h1>
        <Button onClick={() => markRead()} disabled={loading}>
          Barchasini o'qilgan deb belgilash
        </Button>
      </div>
      {error && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 p-4 text-red-700">
          {error}
        </p>
      )}
      {loading ? (
        <p>Yuklanmoqda...</p>
      ) : items.length ? (
        <div className="space-y-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-xl bg-white p-5 shadow-sm dark:bg-[#20262d]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold">{item.title}</h2>
                  <p className="mt-2 text-sm">{item.message}</p>
                  {item.entityId && (
                    <Link
                      className="block mt-3 text-[#c6a47e] underline"
                      to={
                        item.entityType === "projects"
                          ? `/projects/${item.entityId}`
                          : item.entityType === "project-folders"
                            ? `/projects/${item.project}/folders/${item.entityId}`
                            : item.entityType === "files"
                              ? `/files?file=${item.entityId}`
                              : `/${item.entityType}?record=${item.entityId}`
                      }
                    >
                      Ochish
                    </Link>
                  )}
                  <time className="mt-2 block text-xs text-gray-500">
                    {new Date(item.createdAt).toLocaleString()}
                  </time>
                </div>
                {!item.read && (
                  <Button variant="secondary" onClick={() => markRead(item.id)}>
                    O'qilgan deb belgilash
                  </Button>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
      <div className="mt-5 flex items-center gap-3">
        <Button
          variant="secondary"
          disabled={loading || page <= 1}
          onClick={() => setPage(page - 1)}
        >
          Oldingi
        </Button>
        <span>{page}</span>
        <Button
          variant="secondary"
          disabled={loading || page >= (meta?.pages || 1)}
          onClick={() => setPage(page + 1)}
        >
          Keyingi
        </Button>
      </div>
    </div>
  );
}
