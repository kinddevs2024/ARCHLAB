import { useState } from "react";
import { Navigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { FigmaIcon } from "../components/Workspace";
import assets from "../figma-assets.json";
export default function Login() {
  const { user, login, loading: authLoading } = useAuth(),
    [form, setForm] = useState({ email: "", password: "", remember: false }),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [visible, setVisible] = useState(false);
  if (authLoading) return <p className="loading-state">Yuklanmoqda...</p>;
  if (user) return <Navigate to="/projects" replace />;
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    const r = await login(form);
    if (!r.ok) setMessage(r.message);
    setBusy(false);
  };
  return (
    <main className="login-page">
      <div className="login-left">
        <header className="login-brand">
          <span
            className="login-logo"
            style={{
              maskImage: `url(${assets.login.imgImage7})`,
              WebkitMaskImage: `url(${assets.login.imgImage7})`,
            }}
          >
            <img src={assets.login.imgImage8} alt="ARCH LAB" />
          </span>
          <h1>ARCH LAB WOORKROOM</h1>
        </header>
        <form className="login-form" onSubmit={submit}>
          <h2>Xush kelibsiz</h2>
          {message && (
            <p role="alert" className="notice-error">
              {message}
            </p>
          )}
          <label className="login-field">
            <span>
              <FigmaIcon screen="login" name="imgMessage" />
            </span>
            <input
              aria-label="Email"
              placeholder="Email"
              type="email"
              required
              autoComplete="username"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
          <label className="login-field">
            <span>
              <FigmaIcon screen="login" name="imgLock" />
            </span>
            <input
              aria-label="Password"
              placeholder="Password"
              type={visible ? "text" : "password"}
              required
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <button
              type="button"
              aria-label={visible ? "Parolni yashirish" : "Parolni ko'rsatish"}
              onClick={() => setVisible((v) => !v)}
            >
              {visible ? <FaEyeSlash /> : <FaEye />}
            </button>
          </label>
          <label className="login-remember">
            <input
              type="checkbox"
              checked={form.remember}
              onChange={(e) => setForm({ ...form, remember: e.target.checked })}
            />
            Eslab qolish
          </label>
          <button className="login-submit" disabled={busy}>
            {busy ? "Yuklanmoqda..." : "Kirish"}
          </button>
        </form>
        <div className="login-skyline">
          <img src={assets.login.imgGroup} alt="" />
        </div>
      </div>
      <div className="login-photo">
        <img src={assets.login.imgPhoto202110022017541} alt="ARCH LAB binosi" />
      </div>
    </main>
  );
}
