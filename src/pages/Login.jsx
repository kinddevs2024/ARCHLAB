import { Feedback, Loading } from "../components/DesignSystem";
import { Title } from "../components/DesignSystem";
import { Field, Checkbox } from "../components/Input";
import { Action } from "../components/Button";
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
  if (authLoading) return <Loading />;
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
          <Title>ARCH LAB WOORKROOM</Title>
        </header>
        <form className="login-form" onSubmit={submit}>
          <h2>Xush kelibsiz</h2>
          {message && <Feedback>{message}</Feedback>}
          <label className="login-field">
            <span>
              <FigmaIcon screen="login" name="imgMessage" />
            </span>
            <Field
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
            <Field
              aria-label="Password"
              placeholder="Password"
              type={visible ? "text" : "password"}
              required
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <Action
              type="button"
              aria-label={visible ? "Parolni yashirish" : "Parolni ko'rsatish"}
              onClick={() => setVisible((v) => !v)}
            >
              {visible ? <FaEyeSlash /> : <FaEye />}
            </Action>
          </label>
          <Checkbox
            wrapperClassName="login-remember"
            checked={form.remember}
            onChange={(e) => setForm({ ...form, remember: e.target.checked })}
            label={<>Eslab qolish</>}
          />
          <Action type="submit" className="login-submit" disabled={busy}>
            {busy ? "Yuklanmoqda..." : "Kirish"}
          </Action>
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
