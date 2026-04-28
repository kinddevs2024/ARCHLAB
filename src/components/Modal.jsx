import { FaTimes } from "react-icons/fa";

export function Modal({ open, title, children, onClose, size = "normal" }) {
  if (!open) return null;
  const width = size === "wide" ? "max-w-[760px]" : "max-w-[584px]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-[5px]">
      <div className={`max-h-[90vh] w-full ${width} overflow-y-auto rounded-[20px] bg-white shadow-2xl dark:bg-[#171c22]`}>
        <div className="flex items-center justify-between px-12 pb-4 pt-8">
          <h2 className="text-[28px] font-extrabold leading-none text-black dark:text-white">{title}</h2>
          <button
            className="grid h-11 w-11 place-items-center rounded-[14px] bg-[#f5f7fb] text-xl text-[#111827] transition hover:bg-[#edf1f7] dark:bg-[#222a33] dark:text-white"
            onClick={onClose}
            type="button"
          >
            <FaTimes />
          </button>
        </div>
        <div className="px-12 pb-8">{children}</div>
      </div>
    </div>
  );
}
