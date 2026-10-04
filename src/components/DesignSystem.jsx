import { Navbar as MaterialNavbar } from "@material-tailwind/react/components/Navbar/index.js";
import { List as MaterialList } from "@material-tailwind/react/components/List/index.js";
import { ThemeProvider } from "@material-tailwind/react/context/theme.js";
import { Card } from "@material-tailwind/react/components/Card/index.js";
import { Alert } from "@material-tailwind/react/components/Alert/index.js";
import { Spinner } from "@material-tailwind/react/components/Spinner/index.js";
import { Typography } from "@material-tailwind/react/components/Typography/index.js";
import { Chip } from "@material-tailwind/react/components/Chip/index.js";
import { Progress } from "@material-tailwind/react/components/Progress/index.js";
import { ButtonGroup } from "@material-tailwind/react/components/ButtonGroup/index.js";
import { Tabs } from "@material-tailwind/react/components/Tabs/index.js";
import { TabsHeader } from "@material-tailwind/react/components/Tabs/TabsHeader.js";
import { Tab } from "@material-tailwind/react/components/Tabs/Tab.js";

const theme = {
  button: { defaultProps: { ripple: false } },
  iconButton: { defaultProps: { ripple: false } },
  dialog: {
    styles: { base: { backdrop: { backgroundColor: "mt-dialog-backdrop" } } },
  },
};
export function DesignProvider({ children }) {
  return <ThemeProvider value={theme}>{children}</ThemeProvider>;
}
export function Surface({ children, className = "", ...props }) {
  return (
    <Card
      shadow={false}
      data-ui="surface"
      className={`mt-surface ${className}`}
      {...props}
    >
      {children}
    </Card>
  );
}
export function Feedback({
  children,
  className = "",
  kind = "error",
  ...props
}) {
  return (
    <Alert
      variant="ghost"
      data-ui="feedback"
      role={kind === "error" ? "alert" : "status"}
      className={`mt-feedback notice-${kind} ${className}`}
      {...props}
    >
      {children}
    </Alert>
  );
}
export function Loading({ children = "Yuklanmoqda...", className = "" }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`loading-state mt-loading ${className}`}
    >
      <Spinner className="mt-spinner" />
      <span>{children}</span>
    </div>
  );
}
export function Title({ children, className = "", ...props }) {
  return (
    <Typography
      variant="h1"
      className={`mt-page-title ${className}`}
      {...props}
    >
      {children}
    </Typography>
  );
}
export function Badge({ children, className = "", ...props }) {
  return (
    <Chip
      value={children}
      variant="ghost"
      className={`mt-badge ${className}`}
      {...props}
    />
  );
}
export function Meter({ value, label }) {
  return (
    <Progress
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      value={value}
      aria-label={label}
      className="mt-meter"
      barProps={{ className: "mt-meter-bar" }}
    />
  );
}
export function PanelForm({ children, className = "", ...props }) {
  return (
    <Surface className={className.replace("form-grid", "")}>
      <form className="form-grid" {...props}>
        {children}
      </form>
    </Surface>
  );
}
export function SegmentGroup({ children, className = "", ...props }) {
  return (
    <ButtonGroup
      variant="text"
      className={`mt-year-group ${className}`}
      {...props}
    >
      {children}
    </ButtonGroup>
  );
}
export function TabBar({ value, items, onChange }) {
  return (
    <Tabs value={value} className="mt-tabs">
      <TabsHeader
        role="tablist"
        aria-label="Loyiha bo‘limlari"
        className="mt-tab-header"
        indicatorProps={{ className: "mt-tab-indicator" }}
      >
        {items.map((item) => (
          <Tab
            key={item.value}
            value={item.value}
            className="mt-tab"
            role="tab"
            aria-selected={value === item.value}
            tabIndex={value === item.value ? 0 : -1}
            onKeyDown={(event) => {
              const index = items.findIndex(
                (entry) => entry.value === item.value,
              );
              const next =
                event.key === "ArrowRight"
                  ? (index + 1) % items.length
                  : event.key === "ArrowLeft"
                    ? (index + items.length - 1) % items.length
                    : event.key === "Home"
                      ? 0
                      : event.key === "End"
                        ? items.length - 1
                        : -1;
              if (next !== -1) {
                event.preventDefault();
                onChange(items[next].value);
                event.currentTarget
                  .closest('[role="tablist"]')
                  .querySelectorAll('[role="tab"]')
                  .item(next)
                  .focus();
              }
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onChange(item.value);
              }
            }}
            onClick={() => onChange(item.value)}
          >
            {item.label}
          </Tab>
        ))}
      </TabsHeader>
    </Tabs>
  );
}

export function NavigationBar({ children, className = "", ...props }) {
  return (
    <MaterialNavbar
      role="banner"
      className={`mt-navbar ${className}`}
      {...props}
    >
      {children}
    </MaterialNavbar>
  );
}
export function NavigationList({ children, className = "", ...props }) {
  return (
    <MaterialList className={`mt-nav-list ${className}`} {...props}>
      {children}
    </MaterialList>
  );
}
