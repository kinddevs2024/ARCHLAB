import { Children, forwardRef, isValidElement, useId, useState } from "react";
import { Input as MaterialInput } from "@material-tailwind/react/components/Input/index.js";
import { Select as MaterialSelect } from "@material-tailwind/react/components/Select/index.js";
import { SelectOption as Option } from "@material-tailwind/react/components/Select/SelectOption.js";
import { Textarea as MaterialTextarea } from "@material-tailwind/react/components/Textarea/index.js";
import { Checkbox as MaterialCheckbox } from "@material-tailwind/react/components/Checkbox/index.js";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { IconButton } from "./Button";

export const Input = forwardRef(function Input(
  { label, className = "", id: suppliedId, ...props },
  ref,
) {
  const generatedId = useId(),
    id = suppliedId || generatedId;
  const [visible, setVisible] = useState(false),
    password = props.type === "password";
  return (
    <div className="control-field">
      {label && (
        <label htmlFor={id} className="field-label">
          {label}
          {props.required && (
            <span aria-hidden="true" className="required-mark">
              {" "}
              *
            </span>
          )}
        </label>
      )}
      <MaterialInput
        {...props}
        inputRef={ref}
        id={id}
        variant="outlined"
        labelProps={{ className: "hidden" }}
        containerProps={{ className: "mt-field-container" }}
        className={`mt-field field-input ${password ? "mt-password" : ""} ${className}`}
        type={password && visible ? "text" : props.type}
        aria-label={label || props["aria-label"] || props.placeholder}
        icon={
          password ? (
            <IconButton
              className="password-toggle"
              aria-label={visible ? "Parolni yashirish" : "Parolni ko'rsatish"}
              onClick={() => setVisible((v) => !v)}
            >
              {visible ? <FaEyeSlash /> : <FaEye />}
            </IconButton>
          ) : undefined
        }
      />
    </div>
  );
});

export const Field = forwardRef(function Field(
  { className = "", ...props },
  ref,
) {
  return (
    <MaterialInput
      {...props}
      inputRef={ref}
      variant="standard"
      labelProps={{ className: "hidden" }}
      containerProps={{ className: "mt-bare-container" }}
      className={`mt-bare-input ${className}`}
    />
  );
});

function textOf(node) {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (isValidElement(node)) return textOf(node.props.children);
  return Children.toArray(node).map(textOf).join("");
}
function optionsOf(children) {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement(child)) return [];
    if (child.type !== "option") return optionsOf(child.props.children);
    return [
      {
        value: String(child.props.value ?? textOf(child.props.children)),
        label: child.props.children,
        disabled: child.props.disabled,
      },
    ];
  });
}

export function Select({
  label,
  children,
  className = "",
  value,
  defaultValue,
  onChange,
  required,
  name,
  id: suppliedId,
  disabled,
  ...props
}) {
  const generatedId = useId(),
    id = suppliedId || generatedId;
  const options = optionsOf(children);
  const [localValue, setLocalValue] = useState(
    String(defaultValue ?? options[0]?.value ?? ""),
  );
  const selectedValue = String(value ?? localValue);
  const current = options.find((option) => option.value === selectedValue);
  const change = (next) => {
    setLocalValue(next);
    onChange?.({
      target: { value: next, name, id },
      currentTarget: { value: next, name, id },
    });
  };
  return (
    <div className="control-field mt-select-field" data-ui="select">
      {label && (
        <label htmlFor={id} className="field-label">
          {label}
          {required && (
            <span aria-hidden="true" className="required-mark">
              {" "}
              *
            </span>
          )}
        </label>
      )}
      <MaterialSelect
        {...props}
        id={id}
        value={selectedValue}
        onChange={change}
        disabled={disabled}
        variant="outlined"
        labelProps={{ className: "hidden" }}
        containerProps={{ className: "mt-field-container" }}
        className={`mt-field field-input mt-select ${className}`}
        aria-label={label || props["aria-label"]}
        aria-required={required || undefined}
        selected={() => current?.label || "Tanlang"}
        menuProps={{
          className: "mt-select-menu",
          "data-ui": "select-menu",
          style: { zIndex: 10050 },
        }}
        animate={{
          mount: { opacity: 1, y: 0, transition: { duration: 0 } },
          unmount: { opacity: 0, y: 0, transition: { duration: 0 } },
        }}
      >
        {options.map((option, index) => (
          <Option
            key={`${option.value}-${index}`}
            value={option.value}
            disabled={option.disabled}
            data-value={option.value}
            className="mt-select-option"
          >
            {option.label}
          </Option>
        ))}
      </MaterialSelect>
      {/* Native validation/FormData remain available without a duplicate accessible control. */}
      <select
        className="mt-native-validation"
        aria-hidden="true"
        tabIndex={-1}
        name={name}
        value={selectedValue}
        required={required}
        disabled={disabled}
        onChange={(e) => change(e.target.value)}
        onInvalid={(e) => {
          e.preventDefault();
          document.getElementById(id)?.focus();
        }}
      >
        {options.map((option, index) => (
          <option key={index} value={option.value} disabled={option.disabled}>
            {textOf(option.label)}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Textarea({ label, className = "", id: suppliedId, ...props }) {
  const generatedId = useId(),
    id = suppliedId || generatedId;
  return (
    <div className="control-field">
      {label && (
        <label htmlFor={id} className="field-label">
          {label}
        </label>
      )}
      <MaterialTextarea
        {...props}
        id={id}
        labelProps={{ className: "hidden" }}
        containerProps={{ className: "mt-textarea-container" }}
        className={`mt-field field-input field-textarea ${className}`}
        aria-label={label || props["aria-label"] || props.placeholder}
      />
    </div>
  );
}

export function Checkbox({
  label,
  className = "",
  wrapperClassName = "",
  ...props
}) {
  return (
    <div className={`mt-choice ${wrapperClassName}`}>
      <MaterialCheckbox
        {...props}
        label={label}
        ripple={false}
        className={`mt-checkbox ${className}`}
        containerProps={{ className: "mt-checkbox-container" }}
        labelProps={{ className: "mt-checkbox-label" }}
      />
    </div>
  );
}
