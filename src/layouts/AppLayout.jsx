import {
  Link,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useEffect, useState } from "react";
import { FaChartPie, FaTasks, FaFolderOpen } from "react-icons/fa";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { AuthImage } from "../components/AuthImage";
import { FigmaIcon } from "../components/Workspace";
import { RealtimeProvider } from "../context/RealtimeContext";
import assets from "../figma-assets.json";
const items = [
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
  const { user, loading, logout, hasRole } = useAuth(),
    location = useLocation(),
    navigate = useNavigate(),
    [collapsed, setCollapsed] = useState(false),
    [mobileOpen, setMobileOpen] = useState(false),
    [theme, setTheme] = useState(
      () => localStorage.getItem("theme") || "system",
    ),
    [query, setQuery] = useState(""),
    [results, setResults] = useState([]),
    [unread, setUnread] = useState(0);
  useEffect(() => setMobileOpen(false), [location.pathname]);
  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)"),
      apply = () =>
        document.documentElement.classList.toggle(
          "dark",
          theme === "dark" || (theme === "system" && media.matches),
        );
    apply();
    media.addEventListener("change", apply);
    localStorage.setItem("theme", theme);
    return () => media.removeEventListener("change", apply);
  }, [theme]);
  useEffect(() => {
    if (user?.preferences?.theme) setTheme(user.preferences.theme);
  }, [user?.preferences?.theme]);
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const c = new AbortController(),
      timer = setTimeout(
        () =>
          api
            .get("/api/search", { params: { q: query }, signal: c.signal })
            .then(({ data }) => setResults(data.data))
            .catch(() => {}),
        250,
      );
    return () => {
      clearTimeout(timer);
      c.abort();
    };
  }, [query]);
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
  if (loading)
    return (
      <p className="loading-state" role="status">
        Yuklanmoqda...
      </p>
    );
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
          <button
            className="mobile-overlay"
            aria-label="Menyuni yopish"
            onClick={() => setMobileOpen(false)}
          />
        )}
        <aside className="workspace-sidebar">
          <Link className="workspace-logo" to="/projects">
            <img src={assets.projects.imgImage7} alt="ARCH LAB" />
            <span>ARCH LAB</span>
          </Link>
          <nav className="workspace-nav" aria-label="Asosiy menyu">
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
                    ) : to === "/tasks" ? (
                      <FaTasks />
                    ) : to === "/dashboard" ? (
                      <FaChartPie />
                    ) : (
                      <FaFolderOpen />
                    )}
                  </span>
                  <span className="nav-label">{label}</span>
                </Link>
              ))}
          </nav>
          <button
            className="workspace-logout"
            aria-label="Chiqish"
            onClick={logout}
          >
            <FigmaIcon name="imgLogout" />
            <span className="nav-label">Chiqish</span>
          </button>
        </aside>
        <main className="workspace-main">
          <header className="workspace-header">
            <button
              className="icon-button"
              aria-label="Menyuni ochish yoki yig'ish"
              aria-expanded={mobileOpen || !collapsed}
              onClick={toggle}
            >
              <FigmaIcon name="imgFrame461" />
            </button>
            <div className="header-search">
              <div className="header-search-field">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Qidirish"
                  aria-label="Umumiy qidiruv"
                />
                <FigmaIcon name="imgSearch" />
              </div>
              {results.length > 0 && (
                <div className="search-results">
                  {results.map((r) => (
                    <button
                      key={`${r.type}-${r.id}`}
                      onClick={() => {
                        navigate(r.href);
                        setQuery("");
                        setResults([]);
                      }}
                    >
                      {r.title}
                      <small className="block text-gray-400">{r.type}</small>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="header-controls">
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
          </header>
          <div
            className={`workspace-content ${location.pathname === "/chat" ? "chat-content" : ""}`}
          >
            <Outlet context={{ theme, setTheme }} />
          </div>
        </main>
      </div>
    </RealtimeProvider>
  );
}
