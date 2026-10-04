import {
  Surface,
  Title,
  PanelForm,
  Feedback,
} from "../components/DesignSystem";
import { IconButton } from "../components/Button";
import { GitHubStorageCard } from "../components/GitHubStorageCard";
import { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { api, apiMessage } from "../api/client";
import { Button } from "../components/Button";
import { Input, Select } from "../components/Input";
import { AuthImage } from "../components/AuthImage";
import { Notice, FigmaIcon } from "../components/Workspace";
import { useAuth } from "../context/AuthContext";
export default function Settings() {
  const avatar = useRef(null),
    { user, updateUser, hasRole } = useAuth(),
    { theme, changeTheme, themeBusy } = useOutletContext(),
    [profile, setProfile] = useState({
      name: user.name || "",
      surname: user.surname || "",
      phone: user.phone || "",
      address: user.address || "",
      username: user.username || "",
    }),
    [password, setPassword] = useState({
      currentPassword: "",
      newPassword: "",
    }),
    [company, setCompany] = useState(""),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState("");
  useEffect(() => {
    if (hasRole("Admin"))
      api
        .get("/api/settings")
        .then(({ data }) => setCompany(data.companyName))
        .catch((e) => setError(apiMessage(e)));
  }, [hasRole]);
  const act = async (key, fn, success) => {
    setBusy(key);
    setError("");
    setMessage("");
    try {
      await fn();
      setMessage(success);
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      setBusy("");
    }
  };
  const submitProfile = (e) => {
    e.preventDefault();
    act(
      "profile",
      async () => {
        const { data } = await api.patch("/api/profile", profile);
        updateUser(data.user);
      },
      "Profil saqlandi",
    );
  };
  const submitPassword = (e) => {
    e.preventDefault();
    act(
      "password",
      async () => {
        await api.patch("/api/profile/password", password);
        setPassword({ currentPassword: "", newPassword: "" });
      },
      "Parol yangilandi. Boshqa sessiyalar yopildi.",
    );
  };
  const upload = (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (file)
      act(
        "avatar",
        async () => {
          const body = new FormData();
          body.append("file", file);
          const { data } = await api.post("/api/profile/avatar", body);
          updateUser(data.user);
        },
        "Avatar saqlandi",
      );
  };
  return (
    <div>
      <div className="page-heading">
        <Title>Sozlamalar</Title>
      </div>
      <Notice error={error} />
      {message && (
        <Feedback kind="success" role="status" className="notice-success">
          {message}
        </Feedback>
      )}
      <div className="settings-grid">
        <PanelForm className="settings-card form-grid" onSubmit={submitProfile}>
          <h2>Profil</h2>
          <div className="settings-profile-summary flex items-center gap-5">
            <div className="settings-avatar relative">
              <AuthImage
                src={user.avatar}
                alt="Profil rasmi"
                className="h-24 w-24 rounded-full object-cover bg-gray-200"
              />
              <IconButton
                type="button"
                className="avatar-camera"
                aria-label="Profil rasmini tanlash"
                disabled={!!busy}
                onClick={() => avatar.current.click()}
              >
                <FigmaIcon screen="employee-form" name="imgGroup4" />
              </IconButton>
              <input
                ref={avatar}
                hidden
                type="file"
                accept=".png,.jpg,.jpeg,.webp"
                onChange={upload}
              />
            </div>
            <div>
              <strong>{user.email}</strong>
              <p className="mt-2 text-gray-500">
                {user.position || user.status}
              </p>
            </div>
          </div>
          <div className="form-columns">
            <Input
              label="Ism"
              maxLength={120}
              required
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />
            <Input
              label="Familiya"
              maxLength={120}
              value={profile.surname}
              onChange={(e) =>
                setProfile({ ...profile, surname: e.target.value })
              }
            />
            <Input
              label="Telefon"
              maxLength={40}
              value={profile.phone}
              onChange={(e) =>
                setProfile({ ...profile, phone: e.target.value })
              }
            />
            <Input
              label="Username"
              maxLength={80}
              value={profile.username}
              onChange={(e) =>
                setProfile({ ...profile, username: e.target.value })
              }
            />
          </div>
          <Input
            label="Manzil"
            maxLength={500}
            value={profile.address}
            onChange={(e) =>
              setProfile({ ...profile, address: e.target.value })
            }
          />
          <Button disabled={!!busy} type="submit">
            {busy === "profile" ? "Saqlanmoqda..." : "Profilni saqlash"}
          </Button>
        </PanelForm>
        <div className="form-grid">
          <PanelForm
            className="settings-card form-grid"
            onSubmit={submitPassword}
          >
            <h2>Parolni almashtirish</h2>
            <Input
              label="Hozirgi parol"
              type="password"
              autoComplete="current-password"
              required
              value={password.currentPassword}
              onChange={(e) =>
                setPassword({ ...password, currentPassword: e.target.value })
              }
            />
            <Input
              label="Yangi parol"
              type="password"
              minLength={12}
              maxLength={72}
              autoComplete="new-password"
              required
              value={password.newPassword}
              onChange={(e) =>
                setPassword({ ...password, newPassword: e.target.value })
              }
            />
            <small className="text-gray-500">Kamida 12 ta belgi.</small>
            <Button type="submit" disabled={!!busy}>
              Parolni almashtirish
            </Button>
          </PanelForm>
          <Surface className="settings-card form-grid">
            <h2>Shaxsiy sozlamalar</h2>
            <Select
              label="Tema"
              value={theme}
              disabled={!!busy || themeBusy}
              onChange={(e) => changeTheme(e.target.value)}
            >
              <option value="light">Yorug'</option>
              <option value="dark">Qorong'i</option>
              <option value="system">Tizim sozlamasi</option>
            </Select>
          </Surface>
          {hasRole("Admin") && <GitHubStorageCard />}
          {hasRole("Admin") && (
            <PanelForm
              className="settings-card form-grid"
              onSubmit={(e) => {
                e.preventDefault();
                act(
                  "company",
                  () => api.patch("/api/settings", { companyName: company }),
                  "Kompaniya nomi saqlandi",
                );
              }}
            >
              <h2>Kompaniya</h2>
              <Input
                label="Kompaniya nomi"
                required
                maxLength={120}
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
              <Button type="submit" disabled={!!busy}>
                Saqlash
              </Button>
            </PanelForm>
          )}
        </div>
      </div>
    </div>
  );
}
