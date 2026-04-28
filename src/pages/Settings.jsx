import { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { FaCamera } from "react-icons/fa";
import { api, apiMessage } from "../api/client";
import { Button } from "../components/Button";
import { Input, Select } from "../components/Input";
import { AuthImage } from "../components/AuthImage";
import { useAuth } from "../context/AuthContext";

export default function Settings() {
  const avatarRef = useRef(null);
  const { user, updateUser } = useAuth();
  const { theme, setTheme } = useOutletContext();
  const [profile, setProfile] = useState({
    name: user.name || "",
    surname: user.surname || "",
    phone: user.phone || "",
    address: user.address || "",
    username: user.username || "",
  });
  const [password, setPassword] = useState({ currentPassword: "", newPassword: "" });
  const [settings, setSettings] = useState({ companyName: "ARCH LAB", archivePath: "uploads", language: "uz", theme });
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.get("/api/settings").then(({ data }) => setSettings((current) => ({ ...current, ...data }))).catch(() => {});
  }, []);

  const saveProfile = async (event) => {
    event.preventDefault();
    setMessage("");
    try {
      const { data } = await api.patch("/api/profile", profile);
      updateUser(data.user);
      setMessage("Profil saqlandi");
    } catch (err) {
      setMessage(apiMessage(err, "Profilni saqlashda xatolik"));
    }
  };

  const savePassword = async (event) => {
    event.preventDefault();
    setMessage("");
    try {
      await api.patch("/api/profile/password", password);
      setPassword({ currentPassword: "", newPassword: "" });
      setMessage("Parol yangilandi");
    } catch (err) {
      setMessage(apiMessage(err, "Parolni almashtirishda xatolik"));
    }
  };

  const saveSettings = async (event) => {
    event.preventDefault();
    setMessage("");
    try {
      const { data } = await api.patch("/api/settings", settings);
      setSettings(data);
      setTheme(data.theme === "system" ? "light" : data.theme);
      setMessage("Sozlamalar saqlandi");
    } catch (err) {
      setMessage(apiMessage(err, "Sozlamalarni saqlashda xatolik"));
    }
  };

  const uploadAvatar = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const body = new FormData();
    body.append("kind", "avatar");
    body.append("entityType", "users");
    body.append("entityId", user.id);
    body.append("section", "avatars");
    body.append("file", file);
    const { data } = await api.post("/api/profile/avatar", body);
    updateUser(data.user);
    event.target.value = "";
    setMessage("Avatar yuklandi");
  };

  return (
    <div>
      <h1 className="mb-[28px] text-[34px] font-extrabold tracking-[-0.02em]">Sozlamalar</h1>
      {message ? <div className="mb-5 rounded-lg bg-white p-4 text-sm font-semibold text-[#C9A77F] shadow-sm dark:bg-[#20262d]">{message}</div> : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <form className="rounded-xl bg-white p-6 shadow-sm dark:bg-[#20262d]" onSubmit={saveProfile}>
          <h2 className="mb-5 text-xl font-bold">Profil</h2>
          <div className="mb-6 flex items-center gap-5">
            <div className="relative">
              <AuthImage src={user.avatar} alt="" className="h-24 w-24 rounded-full bg-[#ffb51b] object-cover" />
              <button type="button" onClick={() => avatarRef.current?.click()} className="absolute bottom-0 right-0 grid h-8 w-8 place-items-center rounded-full bg-[#C9A77F] text-white">
                <FaCamera />
              </button>
              <input ref={avatarRef} className="hidden" type="file" accept="image/*" onChange={uploadAvatar} />
            </div>
            <div>
              <p className="text-lg font-bold">{user.email}</p>
              <p className="text-sm text-[#7d8291]">{user.status}</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Ism" value={profile.name} onChange={(e) => setProfile((x) => ({ ...x, name: e.target.value }))} />
            <Input label="Familiya" value={profile.surname} onChange={(e) => setProfile((x) => ({ ...x, surname: e.target.value }))} />
            <Input label="Telefon" value={profile.phone} onChange={(e) => setProfile((x) => ({ ...x, phone: e.target.value }))} />
            <Input label="Username" value={profile.username} onChange={(e) => setProfile((x) => ({ ...x, username: e.target.value }))} />
          </div>
          <div className="mt-4"><Input label="Manzil" value={profile.address} onChange={(e) => setProfile((x) => ({ ...x, address: e.target.value }))} /></div>
          <Button className="mt-5 h-[49px] px-6" type="submit">Profilni saqlash</Button>
        </form>

        <div className="grid gap-6">
          <form className="rounded-xl bg-white p-6 shadow-sm dark:bg-[#20262d]" onSubmit={savePassword}>
            <h2 className="mb-5 text-xl font-bold">Parol</h2>
            <div className="grid gap-4">
              <Input label="Hozirgi parol" type="password" value={password.currentPassword} onChange={(e) => setPassword((x) => ({ ...x, currentPassword: e.target.value }))} />
              <Input label="Yangi parol" type="password" value={password.newPassword} onChange={(e) => setPassword((x) => ({ ...x, newPassword: e.target.value }))} />
            </div>
            <Button className="mt-5 h-[49px] px-6" type="submit">Parolni almashtirish</Button>
          </form>

          <form className="rounded-xl bg-white p-6 shadow-sm dark:bg-[#20262d]" onSubmit={saveSettings}>
            <h2 className="mb-5 text-xl font-bold">Kompaniya</h2>
            <div className="grid gap-4">
              <Input label="Kompaniya nomi" value={settings.companyName} onChange={(e) => setSettings((x) => ({ ...x, companyName: e.target.value }))} />
              <Input label="Arxiv papkasi" value={settings.archivePath} onChange={(e) => setSettings((x) => ({ ...x, archivePath: e.target.value }))} />
              <Select label="Tema" value={settings.theme || theme} onChange={(e) => { setSettings((x) => ({ ...x, theme: e.target.value })); setTheme(e.target.value === "system" ? "light" : e.target.value); }}>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </Select>
            </div>
            <Button className="mt-5 h-[49px] px-6" type="submit">Sozlamalarni saqlash</Button>
          </form>
        </div>
      </div>
    </div>
  );
}
