import { useEffect, useRef, useId } from "react";
import { createPortal } from "react-dom";
import { FaTimes } from "react-icons/fa";
const stack = [];
let originalOverflow = "";
export function Modal({ open, title, children, onClose, size = "normal" }) {
  const ref = useRef(null),
    close = useRef(onClose),
    id = useId();
  close.current = onClose;
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    if (!stack.length) {
      originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    stack.push(id);
    ref.current?.focus();
    const keys = (e) => {
      if (stack.at(-1) !== id) return;
      if (e.key === "Escape") {
        e.stopPropagation();
        close.current();
      }
      if (e.key === "Tab") {
        const els = [
            ...ref.current.querySelectorAll(
              'button,input,select,textarea,a[href],[tabindex="0"]',
            ),
          ].filter((x) => !x.disabled && x.getClientRects().length),
          first = els[0],
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
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", keys);
    return () => {
      document.removeEventListener("keydown", keys);
      stack.splice(stack.indexOf(id), 1);
      if (!stack.length) document.body.style.overflow = originalOverflow;
      if (previous?.isConnected) previous.focus();
    };
  }, [open, id]);
  if (!open) return null;
  return createPortal(
    <div className="modal-backdrop">
      <section
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        tabIndex={-1}
        className={`modal-panel ${size === "wide" ? "modal-wide" : ""}`}
      >
        <header className="modal-heading">
          <h2 id={id}>{title}</h2>
          <button
            type="button"
            className="icon-button"
            aria-label="Yopish"
            onClick={onClose}
          >
            <FaTimes />
          </button>
        </header>
        <div className="modal-body">{children}</div>
      </section>
    </div>,
    document.body,
  );
}
