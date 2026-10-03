import { useCallback, useEffect, useMemo, useState } from "react";
import { api, apiMessage } from "./client";
export const dateLabel = (v) =>
  v ? new Date(v).toLocaleDateString("sv-SE") : "—";
export const amountLabel = (v) => Number(v || 0).toLocaleString("uz-UZ");
export const idOf = (v) => v?.id || v?._id || v || "";
export function useCollection(endpoint, filters = {}, limit = 20) {
  const [page, setPage] = useState(1),
    [rows, setRows] = useState([]),
    [meta, setMeta] = useState(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [revision, setRevision] = useState(0);
  const serialized = JSON.stringify(filters);
  useEffect(() => setPage(1), [serialized, endpoint]);
  const params = useMemo(
    () => ({ ...JSON.parse(serialized), page, limit }),
    [serialized, page, limit],
  );
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    const timer = setTimeout(
      () =>
        api
          .get(endpoint, { params, signal: controller.signal })
          .then(({ data }) => {
            setRows(data.data || []);
            setMeta(data.meta || null);
          })
          .catch((e) => {
            if (e.code !== "ERR_CANCELED") setError(apiMessage(e));
          })
          .finally(() => {
            if (!controller.signal.aborted) setLoading(false);
          }),
      150,
    );
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [endpoint, params, revision]);
  const reload = useCallback(() => setRevision((v) => v + 1), []);
  return { rows, meta, error, loading, page, setPage, reload };
}
export async function downloadFile(file) {
  const { data } = await api.get(`/api/files/${file.id}/download`, {
    responseType: "blob",
  });
  const url = URL.createObjectURL(data),
    a = document.createElement("a");
  a.href = url;
  a.download = file.originalName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
