export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}) {
  const styles = {
    primary:
      "bg-[#C6A47E] text-white hover:bg-[#b8966e] shadow-[0_4px_8px_rgba(111,97,129,0.14)]",
    secondary: "bg-[#f3f4f6] text-[#20242a] hover:bg-[#e7e9ee]",
    danger: "bg-[#fff1f1] text-[#ff1f2f] hover:bg-[#ffe5e5]",
    ghost: "bg-transparent text-[#6b7280] hover:bg-[#f3f4f6]",
  };

  return (
    <button
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] px-5 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
