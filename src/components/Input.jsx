import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export function Input({ label, className = "", ...props }) {
  const [visible, setVisible] = useState(false);
  const isPassword = props.type === "password";

  return (
    <label className="block">
      {label ? <span className="mb-2 block text-[16px] font-medium text-[#2f3340] dark:text-slate-200">{label}</span> : null}
      <span className="relative block">
        <input
          className={`h-[52px] w-full rounded-[12px] border border-[#cfd5e1] bg-white px-4 text-[15px] outline-none transition-colors placeholder:text-[#bdc3cf] focus:border-[#C6A47E] dark:border-slate-700 dark:bg-[#171c22] dark:text-white ${isPassword ? "pr-12" : ""} ${className}`}
          {...props}
          type={isPassword && visible ? "text" : props.type}
        />
        {isPassword ? (
          <button
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7c8494] transition hover:text-[#C6A47E]"
            onClick={() => setVisible((value) => !value)}
            aria-label={visible ? "Parolni yashirish" : "Parolni ko'rsatish"}
          >
            {visible ? <FaEyeSlash /> : <FaEye />}
          </button>
        ) : null}
      </span>
    </label>
  );
}

export function Select({ label, children, className = "", ...props }) {
  return (
    <label className="block">
      {label ? <span className="mb-2 block text-[16px] font-medium text-[#2f3340] dark:text-slate-200">{label}</span> : null}
      <select
        className={`h-[52px] w-full rounded-[12px] border border-[#cfd5e1] bg-white px-4 text-[15px] outline-none transition-colors focus:border-[#C6A47E] dark:border-slate-700 dark:bg-[#171c22] dark:text-white ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export function Textarea({ label, className = "", ...props }) {
  return (
    <label className="block">
      {label ? <span className="mb-2 block text-[16px] font-medium text-[#2f3340] dark:text-slate-200">{label}</span> : null}
      <textarea
        className={`min-h-[122px] w-full rounded-[12px] border border-[#cfd5e1] bg-white px-4 py-3 text-[15px] outline-none transition-colors placeholder:text-[#bdc3cf] focus:border-[#C6A47E] dark:border-slate-700 dark:bg-[#171c22] dark:text-white ${className}`}
        {...props}
      />
    </label>
  );
}
