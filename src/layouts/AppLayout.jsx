import {
  Surface,
  NavigationBar,
  NavigationList,
  Loading,
} from "../components/DesignSystem";
import { Action, IconButton } from "../components/Button";
import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { FaMoon, FaSun } from "react-icons/fa";
import { GlobalSearch } from "../components/GlobalSearch";
import { applyTheme, readTheme } from "../api/theme";
import { FaChartPie, FaTasks, FaFolderOpen, FaReceipt } from "react-icons/fa";
import { api, apiMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { AuthImage } from "../components/AuthImage";
import { FigmaIcon } from "../components/Workspace";
import { RealtimeProvider } from "../context/RealtimeContext";
import assets from "../figma-assets.json";
const items = [
  ["/analytics", "Analitika", null],
  ["/projects", "Loyihalar", "imgIcnSidebarProjectsInactive"],
  [
    "/projects/single",
    "Yakka tartibdagi loyihalar",
    "imgIcnSidebarProjectsInactive1",
  ],
  ["/projects/interior", "Interyer", "imgIcnSidebarProjectsInactive1"],
  ["/projects/tex-obs", "Tex-obs", "imgFrame2"],
  ["/projects/laboratory", "Laboratoriya", "imgFrame3"],
  ["/projects/control", "Tashqi nazorat", "imgFrame"],
  ["/projects/render", "Rendr", "imgFrame3"],
  ["/contracts", "Shartnomalar", "imgFrame", "Manager"],
  ["/expenses", "Xarajatlar", null, "Manager"],
  ["/letters", "Xatlar", "imgVector"],
  ["/orders", "Buyruqlar", "imgFrame"],
  ["/users", "Foydalanuvchilar", "img3User", "Admin"],
  ["/chat", "Chat", "imgChat"],
  ["/settings", "Sozlamalar", "imgSetting"],
  ["/tasks", "Vazifalar", null],
  ["/files", "Loyiha fayllari", null],
  ["/dashboard", "Dashboard", null],
];
export function AppLayout() {
  const { user, loading, logout, hasRole, updateUser } = useAuth(),
    location = useLocation(),
    [collapsed, setCollapsed] = useState(false),
    [mobileOpen, setMobileOpen] = useState(false),
    [theme, setTheme] = useState(readTheme),
    [effectiveDark, setEffectiveDark] = useState(
      () => matchMedia("(prefers-color-scheme: dark)").matches,
    ),
    [themeBusy, setThemeBusy] = useState(false),
    [themeError, setThemeError] = useState(""),
    themeSaving = useRef(false),
    [unread, setUnread] = useState(0);
  useEffect(() => setMobileOpen(false), [location.pathname]);
  useLayoutEffect(() => {
    applyTheme(theme);
    setEffectiveDark(document.documentElement.classList.contains("dark"));
    const media = matchMedia("(prefers-color-scheme: dark)");
    const sync = () => {
      applyTheme(theme);
      setEffectiveDark(document.documentElement.classList.contains("dark"));
    };
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [theme]);
  useLayoutEffect(() => {
    if (user?.preferences?.theme) setTheme(user.preferences.theme);
  }, [user?.preferences?.theme]);
  useEffect(() => {
    const sync = (e) => {
      if (e.key === "theme" && !themeSaving.current) setTheme(readTheme());
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  const changeTheme = async (next) => {
    if (themeSaving.current || next === theme) return;
    const previous = theme;
    themeSaving.current = true;
    setThemeBusy(true);
    setThemeError("");
    setTheme(next);
    try {
      const { data } = await api.patch("/api/profile/preferences", {
        theme: next,
      });
      updateUser(data.user);
    } catch (e) {
      setTheme(previous);
      setThemeError(apiMessage(e));
    } finally {
      themeSaving.current = false;
      setThemeBusy(false);
    }
  };
  useEffect(() => {
    if (!user) return;
    const refresh = () =>
      api
        .get("/api/notifications?limit=1")
        .then(({ data }) => setUnread(data.unread))
        .catch(() => {});
    refresh();
    window.addEventListener("notifications:changed", refresh);
    return () => window.removeEventListener("notifications:changed", refresh);
  }, [user, location.pathname]);
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  const toggle = () => {
    if (innerWidth < 1024) setMobileOpen((v) => !v);
    else setCollapsed((v) => !v);
  };
  return (
    <RealtimeProvider user={user}>
      <div
        className={`workspace ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}
      >
        {mobileOpen && (
          <Action
            className="mobile-overlay"
            aria-label="Menyuni yopish"
            onClick={() => setMobileOpen(false)}
          />
        )}
        <Surface role="complementary" className="workspace-sidebar">
          <Link className="workspace-logo" to="/projects">
            <img src={assets.projects.imgImage7} alt="ARCH LAB" />
            <span>ARCH LAB</span>
          </Link>
          <NavigationList className="workspace-nav" aria-label="Asosiy menyu">
            {items
              .filter((i) => !i[3] || hasRole(i[3]))
              .map(([to, label, icon]) => (
                <Link
                  key={to}
                  to={to}
                  className={location.pathname === to ? "active" : ""}
                  aria-current={location.pathname === to ? "page" : undefined}
                  title={label}
                >
                  <span className="nav-icon">
                    {icon ? (
                      <span
                        className={
                          [
                            "/projects/control",
                            "/contracts",
                            "/orders",
                          ].includes(to)
                            ? "control-icon"
                            : ""
                        }
                      >
                        {[
                          "/projects/control",
                          "/contracts",
                          "/orders",
                        ].includes(to) ? (
                          <>
                            <FigmaIcon name="imgGroup" />
                            <FigmaIcon name="imgGroup1" />
                            <i />
                          </>
                        ) : (
                          <FigmaIcon name={icon} />
                        )}
                      </span>
                    ) : to === "/expenses" ? (
                      <FaReceipt />
                    ) : to === "/tasks" ? (
                      <FaTasks />
                    ) : ["/dashboard", "/analytics"].includes(to) ? (
                      <FaChartPie />
                    ) : (
                      <FaFolderOpen />
                    )}
                  </span>
                  <span className="nav-label">{label}</span>
                </Link>
              ))}
          </NavigationList>
          <Action
            className="workspace-logout"
            aria-label="Chiqish"
            onClick={logout}
          >
            <FigmaIcon name="imgLogout" />
            <span className="nav-label">Chiqish</span>
          </Action>
        </Surface>
        <main className="workspace-main">
          <NavigationBar className="workspace-header">
            <IconButton
              className="icon-button"
              aria-label="Menyuni ochish yoki yig'ish"
              aria-expanded={mobileOpen || !collapsed}
              onClick={toggle}
            >
              <FigmaIcon name="imgFrame461" />
            </IconButton>
            <GlobalSearch />
            <div className="header-controls">
              <IconButton
                type="button"
                className="icon-button theme-toggle"
                disabled={themeBusy}
                aria-label={
                  effectiveDark
                    ? "Yorug' rejimga o'tish"
                    : "Qorong'i rejimga o'tish"
                }
                onClick={() =>
                  changeTheme(
                    document.documentElement.classList.contains("dark")
                      ? "light"
                      : "dark",
                  )
                }
              >
                <FaSun className="theme-sun" />
                <FaMoon className="theme-moon" />
              </IconButton>
              <Link
                to="/notifications"
                className="icon-button relative"
                aria-label={`Bildirishnomalar: ${unread} o'qilmagan`}
              >
                <FigmaIcon name="imgNotification" />
                {unread > 0 && (
                  <span className="absolute right-2 top-1 h-2 w-2 rounded-full bg-red-500" />
                )}
              </Link>
              <Link
                to="/settings"
                className="header-profile"
                aria-label="Profil sozlamalari"
              >
                <div>
                  <p>
                    {user.name || user.username} {user.surname}
                  </p>
                  <small>{user.position || user.status}</small>
                </div>
                <AuthImage src={user.avatar} alt="Profil" />
              </Link>
            </div>
          </NavigationBar>
          {themeError && (
            <div role="alert" className="theme-error">
              {themeError}
              <Action
                onClick={() => setThemeError("")}
                aria-label="Xabarni yopish"
              >
                ×
              </Action>
            </div>
          )}
          <div
            key={location.pathname}
            className={`workspace-content ${location.pathname === "/chat" ? "chat-content" : ""}`}
          >
            <Outlet context={{ theme, changeTheme, themeBusy }} />
          </div>
        </main>
      </div>
    </RealtimeProvider>
  );
}
