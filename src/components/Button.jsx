export function Button({
  children,
  variant = "primary",
  className = "",
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      className={`ui-button ui-button-${variant} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
