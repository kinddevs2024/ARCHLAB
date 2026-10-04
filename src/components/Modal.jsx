import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useId,
  useState,
} from "react";
import { Dialog } from "@material-tailwind/react/components/Dialog/index.js";
import { DialogHeader } from "@material-tailwind/react/components/Dialog/DialogHeader.js";
import { DialogBody } from "@material-tailwind/react/components/Dialog/DialogBody.js";
import { animate, createScope } from "animejs";
import { FaTimes } from "react-icons/fa";
import { IconButton } from "./Button";

const stack = [];
const instant = {
  mount: { opacity: 1, y: 0, transition: { duration: 0 } },
  unmount: { opacity: 1, y: 0, transition: { duration: 0 } },
};

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
    saved = useRef({ title, children });
  const id = useId(),
    [present, setPresent] = useState(open),
    [panelNode, setPanelNode] = useState(null);
  const bindPanel = useCallback((node) => {
    ref.current = node;
    setPanelNode(node);
  }, []);
  close.current = onClose;
  canClose.current = dismissible;
  if (open) saved.current = { title, children };
  useEffect(() => {
    if (open) setPresent(true);
  }, [open]);
  useLayoutEffect(() => {
    if (!present || !ref.current) return;
    const panel = ref.current;
    const backdrop = panel.parentElement,
      overlay = backdrop.parentElement;
    const layer =
      10000 +
      Math.max(0, stack.indexOf(id) === -1 ? stack.length : stack.indexOf(id)) *
        10;
    backdrop.classList.add("modal-backdrop");
    backdrop.classList.toggle("modal-open", open);
    backdrop.classList.toggle("modal-closing", !open);
    backdrop.style.zIndex = String(layer);
    overlay.style.zIndex = String(layer);
    panel.setAttribute("aria-labelledby", id);
    panel.removeAttribute("aria-describedby");
    panel.setAttribute("aria-modal", "true");
    panel.removeAttribute("aria-hidden");
    const scope = createScope({ root: panel });
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!open && reduced) {
      setPresent(false);
      return;
    }
    if (!reduced)
      scope.add(() =>
        animate(panel, {
          opacity: open ? [0, 1] : [1, 0],
          y: open ? [10, 0] : [0, 6],
          scale: open ? [0.985, 1] : [1, 0.99],
          duration: open ? 220 : 140,
          ease: "out(3)",
          onComplete: () => {
            if (!open) setPresent(false);
          },
        }),
      );
    return () => scope.revert();
  }, [open, present, id, panelNode]);
  useEffect(() => {
    if (!present) return;
    stack.push(id);
    const keys = (e) => {
      if (stack.at(-1) !== id) return;
      if (e.key === "Escape" && open && canClose.current) {
        e.preventDefault();
        e.stopPropagation();
        close.current();
      }
    };
    const outside = (e) => {
      if (
        open &&
        canClose.current &&
        stack.at(-1) === id &&
        ref.current &&
        !ref.current.contains(e.target) &&
        !e.target.closest(".mt-select-menu, .mt-tooltip") &&
        e.target.closest("[data-floating-ui-portal]")
      )
        close.current();
    };
    document.addEventListener("keydown", keys, true);
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("keydown", keys, true);
      document.removeEventListener("pointerdown", outside);
      const i = stack.indexOf(id);
      if (i >= 0) stack.splice(i, 1);
    };
  }, [present, id, open]);
  if (!present) return null;
  const display = open ? { title, children } : saved.current;
  return (
    <Dialog
      ref={bindPanel}
      open={present}
      handler={() => {
        if (open && canClose.current && stack.at(-1) === id) close.current();
      }}
      dismiss={{ enabled: false }}
      animate={instant}
      size={size === "wide" ? "lg" : "md"}
      className={`modal-panel mt-dialog ${size === "wide" ? "modal-wide" : ""}`}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <DialogHeader className="modal-heading">
        <h2 id={id}>{display.title}</h2>
        <IconButton
          className="icon-button"
          aria-label="Yopish"
          disabled={!dismissible}
          onClick={onClose}
        >
          <FaTimes />
        </IconButton>
      </DialogHeader>
      <DialogBody className="modal-body">{display.children}</DialogBody>
    </Dialog>
  );
}
