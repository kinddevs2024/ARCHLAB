import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
export function Input({ label, className = "", ...props }) {
  const [visible, setVisible] = useState(false),
    password = props.type === "password";
  return (
    <label className="block">
      {label && <span className="field-label">{label}</span>}
      <span className="relative block">
        <input
          className={`field-input ${password ? "pr-12" : ""} ${className}`}
          {...props}
          type={password && visible ? "text" : props.type}
          aria-label={label || props["aria-label"] || props.placeholder}
        />
        {password && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute right-4 top-1/2 -translate-y-1/2"
            aria-label={visible ? "Parolni yashirish" : "Parolni ko'rsatish"}
          >
            {visible ? <FaEyeSlash /> : <FaEye />}
          </button>
        )}
      </span>
    </label>
  );
}
export function Select({ label, children, className = "", ...props }) {
  return (
    <label className="block">
      {label && <span className="field-label">{label}</span>}
      <select
        className={`field-input ${className}`}
        aria-label={label || props["aria-label"]}
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
      {label && <span className="field-label">{label}</span>}
      <textarea
        className={`field-input field-textarea ${className}`}
        aria-label={label || props["aria-label"] || props.placeholder}
        {...props}
      />
    </label>
  );
}
