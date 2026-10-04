import { useEffect, useState } from "react";
import { api } from "../api/client";
export function GitHubStorageCard() {
  const [data, setData] = useState(null),
    [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    const refresh = () =>
      api
        .get("/api/storage/status")
        .then(({ data }) => {
          if (active) {
            setData(data);
            setError(false);
          }
        })
        .catch(() => {
          if (active) setError(true);
        });
    refresh();
    const timer = setInterval(refresh, 15000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);
  if (!data?.enabled && !error) return null;
  return (
    <section className="settings-card form-grid">
      <h2>Hujjatlar zaxirasi</h2>
      {error ? (
        <p role="status">Zaxira holatini hozir tekshirib bo'lmadi.</p>
      ) : (
        <>
          <p className="text-gray-500">
            GitHub · {data.owner} · Yopiq loyiha arxivlari
          </p>
          <dl className="storage-statistics">
            <div>
              <dt>Saqlandi</dt>
              <dd>{data.saved}</dd>
            </div>
            <div>
              <dt>Navbatda</dt>
              <dd>{data.pending}</dd>
            </div>
            <div>
              <dt>Loyihalar</dt>
              <dd>{data.repositories}</dd>
            </div>
          </dl>
          <p
            className={
              data.workerHealthy && !data.errors
                ? "notice-success"
                : "notice-error"
            }
          >
            {!data.workerHealthy
              ? "Zaxiralash xizmati bilan aloqa tekshirilmoqda"
              : data.errors
                ? `${data.errors} ta yuklash qayta urinilmoqda. Fayllar serverda saqlangan.`
                : "Zaxiralash xizmati ishlamoqda"}
          </p>
          <small className="text-gray-500">
            Tekshirilgan nusxa saqlangach, server keshi {data.cacheHours}{" "}
            soatdan keyin tozalanadi. Bir fayl: {data.maxFileSizeMb} MB gacha.
            Loyihani arxivlash GitHub nusxasini o'chirmaydi.
          </small>
        </>
      )}
    </section>
  );
}
