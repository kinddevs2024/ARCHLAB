import { Link, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaBell,
  FaBriefcase,
  FaClipboardCheck,
  FaCog,
  FaEnvelope,
  FaFolder,
  FaLayerGroup,
  FaMoon,
  FaSearch,
  FaSignOutAlt,
  FaSun,
  FaUsers,
  FaBars,
} from "react-icons/fa";
import { api } from "../api/client";
import { AuthImage } from "../components/AuthImage";
import { useAuth } from "../context/AuthContext";

const items = [
  { to: "/projects", label: "Loyihalar", icon: FaLayerGroup },
  { to: "/projects/single", label: "Yakka tartibdagi loyihalar", icon: FaLayerGroup },
  { to: "/projects/interior", label: "Interyer", icon: FaLayerGroup },
  { to: "/projects/tex-obs", label: "Tex-obs", icon: FaClipboardCheck },
  { to: "/projects/laboratory", label: "Laboratoriya", icon: FaFolder },
  { to: "/projects/control", label: "Tashqi nazorat", icon: FaBriefcase },
  { to: "/projects/render", label: "Rendr", icon: FaFolder },
  { to: "/contracts", label: "Shartnomalar", icon: FaBriefcase },
  { to: "/letters", label: "Xatlar", icon: FaEnvelope },
  { to: "/orders", label: "Buyuruqlar", icon: FaBriefcase },
  { to: "/users", label: "Foydalanuvchilar", icon: FaUsers },
  { to: "/settings", label: "Sozlamalar", icon: FaCog },
];

const resultPath = (result) => {
  if (result.type === "project") return `/projects/${result.id}`;
  if (result.type === "contract") return "/contracts";
  if (result.type === "letter") return "/letters";
  if (result.type === "order") return "/orders";
  if (result.type === "user") return "/users";
  if (result.type === "file") return "/letters";
  return "/projects";
};

export function AppLayout() {
  const { user, loading, logout, hasRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("sidebar") === "collapsed");
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("sidebar", collapsed ? "collapsed" : "open");
  }, [collapsed]);

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const { data } = await api.get(`/api/search?q=${encodeURIComponent(query.trim())}`);
      setSearchResults(data.data || []);
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const loadNotifications = useCallback(async () => {
    const { data } = await api.get("/api/notifications?limit=10");
    setNotifications(data.data || []);
    setUnread(data.unread || 0);
  }, []);

  useEffect(() => {
    if (user && hasRole("Owner")) loadNotifications().catch(() => {});
  }, [user, hasRole, loadNotifications]);

  const activePath = useMemo(() => location.pathname, [location.pathname]);
  if (loading) return <div className="grid min-h-screen place-items-center">Yuklanmoqda...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!hasRole("Owner")) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f6f8fd] px-4 text-center dark:bg-[#161a1f]">
        <div className="max-w-md rounded-xl border border-[#e6e9f0] bg-white p-8 shadow-sm dark:border-[#323944] dark:bg-[#20262d]">
          <img src="/logo.svg" alt="ARCH LAB" className="mx-auto mb-5 h-14 w-14 rounded-xl" />
          <h1 className="text-2xl font-bold">Owner ruxsati kerak</h1>
          <p className="mt-3 text-sm text-[#6b7280] dark:text-[#a9b1bf]">
            Hozircha workroom faqat Owner uchun ochiq. Owner sizni loyiha va vazifalarga tayinlagandan keyin ishchi kabinet ochiladi.
          </p>
          <button onClick={logout} className="mt-6 h-11 rounded-lg bg-[#C6A47E] px-6 text-sm font-semibold text-white">
            Chiqish
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6fb] text-[#2a2e37] dark:bg-[#161a1f] dark:text-[#f7f8fb]">
      <aside className={`fixed left-0 top-0 z-20 flex h-screen flex-col bg-[#282D32] px-[10px] py-[26px] text-white transition-all ${collapsed ? "w-[92px]" : "w-[280px]"}`}>
        <Link to="/projects" className={`mb-[28px] flex items-center gap-[17px] ${collapsed ? "justify-center px-0" : "px-[35px]"}`}>
          <img src="/logo.svg" alt="ARCH LAB" className="h-[47px] w-[47px] rounded-[11px] border border-[#C9A77F]" />
          {!collapsed ? <div className="text-[27px] font-extrabold tracking-[-0.02em]">ARCH LAB</div> : null}
        </Link>
        <nav className="flex flex-1 flex-col gap-[13px] overflow-y-auto pr-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activePath === item.to || (item.to !== "/projects" && activePath.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                title={collapsed ? item.label : undefined}
                className={`flex h-[50px] items-center rounded-[8px] text-[14px] font-bold transition-colors ${
                  collapsed ? "justify-center px-0" : "gap-[20px] px-[22px]"
                } ${isActive ? "bg-white/10 text-[#C9A77F]" : "text-[#FAF8F2] hover:bg-white/10"}`}
              >
                <Icon className="text-[18px]" />
                {!collapsed ? item.label : null}
              </Link>
            );
          })}
        </nav>
        <button onClick={logout} className={`mt-4 flex h-12 items-center rounded-[4px] bg-white/10 text-left text-[16px] font-bold text-[#d7d7d7] hover:bg-red-600 ${collapsed ? "justify-center px-0" : "gap-4 px-[35px]"}`}>
          <FaSignOutAlt /> {!collapsed ? "Chiqish" : null}
        </button>
      </aside>

      <main className={`min-h-screen transition-all ${collapsed ? "ml-[92px]" : "ml-[280px]"}`}>
        <header className="sticky top-0 z-10 grid h-[100px] grid-cols-[80px_1fr_auto] items-center border-b border-[#cfd3dc] bg-white px-6 dark:border-[#323944] dark:bg-[#20262d]">
          <button className="grid h-10 w-10 place-items-center text-[25px] text-black dark:text-white" onClick={() => setCollapsed((value) => !value)} title="Sidebar">
            <FaBars />
          </button>
          <div className="relative mx-auto">
            <div className="flex h-[52px] w-[350px] items-center gap-3 rounded-[12px] border border-[#c8ceda] bg-white px-4 dark:border-[#323944] dark:bg-[#161a1f]">
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Qidirish" className="w-full bg-transparent text-[16px] outline-none placeholder:text-[#596071]" />
              <FaSearch className="text-[24px] text-black dark:text-white" />
            </div>
            {searchResults.length ? (
              <div className="absolute left-0 top-[60px] z-30 w-[350px] overflow-hidden rounded-xl border border-[#e6e9f0] bg-white shadow-xl dark:border-[#323944] dark:bg-[#20262d]">
                {searchResults.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    className="block w-full px-4 py-3 text-left hover:bg-[#f4f6fb] dark:hover:bg-[#2c333d]"
                    onClick={() => {
                      navigate(resultPath(result));
                      setQuery("");
                      setSearchResults([]);
                    }}
                  >
                    <p className="text-sm font-bold">{result.title}</p>
                    <p className="text-xs text-[#7d8291]">{result.type} {result.subtitle ? `- ${result.subtitle}` : ""}</p>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="flex items-center gap-7">
            <button className="grid h-10 w-10 place-items-center rounded-full bg-[#f4f6fb] text-[#C9A77F] dark:bg-[#161a1f]" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? <FaSun /> : <FaMoon />}
            </button>
            <div className="relative">
              <button className="relative text-[#C9A77F]" onClick={() => setNotificationsOpen((value) => !value)}>
                <FaBell className="text-[24px]" />
                {unread ? <span className="absolute right-0 top-0 h-[10px] w-[10px] rounded-full bg-[#c93c45]" /> : null}
              </button>
              {notificationsOpen ? (
                <div className="absolute right-0 top-10 z-30 w-[340px] rounded-xl border border-[#e6e9f0] bg-white p-3 shadow-xl dark:border-[#323944] dark:bg-[#20262d]">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-bold">Bildirishnomalar</p>
                    <button className="text-xs text-[#C9A77F]" onClick={async () => { await api.patch("/api/notifications/read-all"); await loadNotifications(); }}>Hammasi o'qildi</button>
                  </div>
                  {notifications.length ? notifications.map((item) => (
                    <div key={item.id} className="rounded-lg px-3 py-2 hover:bg-[#f4f6fb] dark:hover:bg-[#2c333d]">
                      <p className="text-sm font-bold">{item.title}</p>
                      <p className="text-xs text-[#7d8291]">{item.message || item.type}</p>
                    </div>
                  )) : <p className="py-4 text-center text-sm text-[#7d8291]">Hozircha bildirishnoma yo'q</p>}
                </div>
              ) : null}
            </div>
            <div className="flex items-center gap-[20px]">
              <div className="text-right">
                <p className="text-[16px] font-medium text-black dark:text-white">{user.name || user.username || "Owner"} {user.surname}</p>
                <p className="mt-1 text-[12px] text-[#8b8b8b]">Asosiy arxitektor</p>
              </div>
              <AuthImage src={user?.avatar} alt="" className="h-[56px] w-[56px] rounded-full bg-[#ffb51b] object-cover ring-[8px] ring-[#ffb51b]" />
            </div>
          </div>
        </header>
        <div className="mx-auto max-w-[1160px] px-6 py-[44px]">
          <Outlet context={{ theme, setTheme, reloadNotifications: loadNotifications }} />
        </div>
      </main>
    </div>
  );
}
