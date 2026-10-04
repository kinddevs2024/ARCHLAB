const valid = new Set(["light", "dark", "system"]);
export const readTheme = () => {
  try {
    const stored = localStorage.getItem("theme");
    return valid.has(stored) ? stored : "system";
  } catch {
    return "system";
  }
};
export const applyTheme = (theme) => {
  const mode = valid.has(theme) ? theme : "system";
  const dark =
    mode === "dark" ||
    (mode === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  const root = document.documentElement;
  const changed = root.classList.contains("dark") !== dark;
  root.classList.toggle("dark", dark);
  root.dataset.theme = mode;
  root.style.colorScheme = dark ? "dark" : "light";
  if (changed) window.dispatchEvent(new Event("archlab:theme"));
  try {
    localStorage.setItem("theme", mode);
  } catch {
    /* Private storage may be unavailable. */
  }
};
