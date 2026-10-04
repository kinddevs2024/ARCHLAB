import { forwardRef } from "react";
import { Button as MaterialButton } from "@material-tailwind/react/components/Button/index.js";
import { IconButton as MaterialIconButton } from "@material-tailwind/react/components/IconButton/index.js";
import { Tooltip } from "@material-tailwind/react/components/Tooltip/index.js";

export const Button = forwardRef(function Button(
  { children, variant = "primary", className = "", type = "button", ...props },
  ref,
) {
  const materialVariant =
    variant === "secondary"
      ? "outlined"
      : variant === "ghost"
        ? "text"
        : "filled";
  return (
    <MaterialButton
      ref={ref}
      type={type}
      variant={materialVariant}
      ripple={false}
      data-ui="button"
      className={`ui-button ui-button-${variant} ${className}`}
      {...props}
    >
      {children}
    </MaterialButton>
  );
});

// Lightweight actions retain each call site's semantics and layout (rows, tabs, chat).
export const Action = forwardRef(function Action(
  { children, className = "", type = "button", ...props },
  ref,
) {
  return (
    <MaterialButton
      ref={ref}
      type={type}
      variant="text"
      ripple={false}
      data-ui="action"
      className={`mt-action ${className}`}
      {...props}
    >
      {children}
    </MaterialButton>
  );
});

export const IconButton = forwardRef(function IconButton(
  { children, className = "", tooltip, type = "button", ...props },
  ref,
) {
  const button = (
    <MaterialIconButton
      ref={ref}
      type={type}
      variant="text"
      ripple={false}
      data-ui="icon-button"
      className={`mt-icon-button ${className}`}
      {...props}
    >
      {children}
    </MaterialIconButton>
  );
  return tooltip ? (
    <Tooltip
      content={tooltip}
      className="mt-tooltip"
      animate={{
        mount: { opacity: 1, transition: { duration: 0 } },
        unmount: { opacity: 0, transition: { duration: 0 } },
      }}
    >
      {button}
    </Tooltip>
  ) : (
    button
  );
});
