import { useState } from "react";
import {
  FaChevronLeft,
  FaChevronRight,
  FaPen,
  FaTrash,
  FaUndo,
} from "react-icons/fa";
import { Button } from "./Button";
import { Modal } from "./Modal";
import assets from "../figma-assets.json";
export function FigmaIcon({ name, screen = "projects" }) {
  return assets[screen]?.[name] ? (
    <img className="figma-icon" src={assets[screen][name]} alt="" />
  ) : null;
}
export function Notice({ error, loading, onRetry }) {
  if (error)
    return (
      <div role="alert" className="notice-error">
        {error}
        {onRetry && (
          <Button variant="secondary" onClick={onRetry}>
            Qayta urinish
          </Button>
        )}
      </div>
    );
  if (loading)
    return (
      <p role="status" className="loading-state">
        Yuklanmoqda...
      </p>
    );
  return null;
}
export function Pagination({ meta, page, onChange, loading }) {
  if (!meta || meta.pages <= 1) return null;
  return (
    <nav className="pagination" aria-label="Sahifalar">
      <Button
        variant="secondary"
        disabled={page <= 1 || loading}
        onClick={() => onChange(page - 1)}
      >
        Oldingi
      </Button>
      <span>
        {page} / {meta.pages} · Jami {meta.total}
      </span>
      <Button
        variant="secondary"
        disabled={page >= meta.pages || loading}
        onClick={() => onChange(page + 1)}
      >
        Keyingi
      </Button>
    </nav>
  );
}
export function YearFilter({ value, onChange }) {
  const current = new Date().getFullYear(),
    [start, setStart] = useState(current - 5);
  return (
    <div className="year-filter" aria-label="Yil bo'yicha filter">
      <button aria-label="Oldingi yillar" onClick={() => setStart(start - 6)}>
        <FaChevronLeft />
      </button>
      <button className={!value ? "selected" : ""} onClick={() => onChange("")}>
        Barchasi
      </button>
      {Array.from({ length: 6 }, (_, i) => start + i).map((year) => (
        <button
          key={year}
          className={Number(value) === year ? "selected" : ""}
          onClick={() => onChange(String(year))}
        >
          {year}
        </button>
      ))}
      <button aria-label="Keyingi yillar" onClick={() => setStart(start + 6)}>
        <FaChevronRight />
      </button>
    </div>
  );
}
export function ConfirmAction({
  open,
  title = "Arxivlash",
  onClose,
  onConfirm,
  busy,
}) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <p className="mb-5">
        Yozuv arxivga o'tkaziladi. Keyin uni tiklash mumkin.
      </p>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>
          Bekor qilish
        </Button>
        <Button disabled={busy} onClick={onConfirm}>
          {busy ? "Saqlanmoqda..." : "Tasdiqlash"}
        </Button>
      </div>
    </Modal>
  );
}
export function RowActions({ onEdit, onArchive, onRestore }) {
  return (
    <div className="row-actions">
      {onEdit && (
        <button className="row-edit" aria-label="Tahrirlash" onClick={onEdit}>
          <FaPen />
        </button>
      )}
      {onArchive && (
        <button
          className="row-delete"
          aria-label="Arxivlash"
          onClick={onArchive}
        >
          <FaTrash />
        </button>
      )}
      {onRestore && (
        <button className="row-edit" aria-label="Tiklash" onClick={onRestore}>
          <FaUndo />
        </button>
      )}
    </div>
  );
}
