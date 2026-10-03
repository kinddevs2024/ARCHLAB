import { useEffect, useRef, useId, useState } from "react";
import { createPortal } from "react-dom";
import { FaTimes } from "react-icons/fa";
const stack = [];
let originalOverflow = "";
export function Modal({
  open,
  title,
  children,
  onClose,
  size = "normal",
  dismissible = true,
}) {
  const ref = useRef(null),
    close = useRef(onClose),
    canClose = useRef(dismissible),
    saved = useRef({ title, children }),
    id = useId(),
    [present, setPresent] = useState(open),
    [depth, setDepth] = useState(() => stack.length);
  close.current = onClose;
  canClose.current = dismissible;
  if (open) saved.current = { title, children };
  useEffect(() => {
    if (open) {
      setPresent(true);
      return;
    }
    const timer = setTimeout(() => setPresent(false), 180);
    return () => clearTimeout(timer);
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    if (!stack.length) {
      originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    stack.push(id);
    setDepth(stack.length - 1);
    ref.current?.focus();
    const keys = (e) => {
      if (stack.at(-1) !== id) return;
      if (e.key === "Escape") {
        e.stopPropagation();
        if (canClose.current) close.current();
      }
      if (e.key === "Tab") {
        const els = [
          ...ref.current.querySelectorAll(
            'button,input,select,textarea,a[href],[tabindex="0"]',
          ),
        ].filter((x) => !x.disabled && x.getClientRects().length);
        const first = els[0],
          last = els.at(-1);
        if (!els.length) {
          e.preventDefault();
          return;
        }
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault();
          last.focus();
        } else if (
          !e.shiftKey &&
          (document.activeElement === last ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", keys);
    return () => {
      document.removeEventListener("keydown", keys);
      const index = stack.indexOf(id);
      if (index >= 0) stack.splice(index, 1);
      if (!stack.length) document.body.style.overflow = originalOverflow;
      if (previous?.isConnected) previous.focus();
    };
  }, [open, id]);
  if (!open && !present) return null;
  const display = open ? { title, children } : saved.current;
  return createPortal(
    <div
      className={`modal-backdrop ${open ? "modal-open" : "modal-closing"}`}
      aria-hidden={!open || undefined}
      style={{ zIndex: 100 + depth * 10 }}
      onMouseDown={(e) => {
        if (
          e.target === e.currentTarget &&
          open &&
          canClose.current &&
          stack.at(-1) === id
        )
          close.current();
      }}
    >
      <section
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        tabIndex={-1}
        className={`modal-panel ${size === "wide" ? "modal-wide" : ""}`}
      >
        <header className="modal-heading">
          <h2 id={id}>{display.title}</h2>
          <button
            type="button"
            className="icon-button"
            aria-label="Yopish"
            disabled={!dismissible}
            onClick={onClose}
          >
            <FaTimes />
          </button>
        </header>
        <div className="modal-body">{display.children}</div>
      </section>
    </div>,
    document.body,
  );
}
