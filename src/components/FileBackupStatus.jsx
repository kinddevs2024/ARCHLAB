export function FileBackupStatus({ file }) {
  const status = file.storage?.status;
  if (!status) return null;
  const text =
    status === "synced"
      ? "Zaxira saqlandi"
      : status === "error"
        ? "Zaxiralash qayta uriniladi"
        : status === "syncing"
          ? "Zaxiraga yuklanmoqda"
          : "Zaxira navbatda";
  return (
    <small
      className={`backup-status backup-${status}`}
      title={
        status === "synced"
          ? "GitHub dagi nusxa tekshirilgan"
          : "Asl fayl serverda saqlangan"
      }
    >
      {text}
    </small>
  );
}
