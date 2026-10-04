import { Surface, Title } from "../components/DesignSystem";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaFolderOpen, FaTasks, FaFile, FaUsers } from "react-icons/fa";
import { api, apiMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Notice } from "../components/Workspace";
export default function Dashboard() {
  const { hasRole } = useAuth(),
    [stats, setStats] = useState({}),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [revision, setRevision] = useState(0);
  const admin = hasRole("Admin");
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    const types = ["projects", "tasks", "files", ...(admin ? ["users"] : [])];
    Promise.all(
      types.map(async (type) => {
        const { data } = await api.get(`/api/${type}?limit=1`);
        return [type, data.meta.total];
      }),
    )
      .then((items) => {
        if (active) setStats(Object.fromEntries(items));
      })
      .catch((e) => {
        if (active) setError(apiMessage(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [admin, revision]);
  const cards = [
    ["Loyihalar", "projects", FaFolderOpen],
    ["Vazifalar", "tasks", FaTasks],
    ["Fayllar", "files", FaFile],
    ...(admin ? [["Foydalanuvchilar", "users", FaUsers]] : []),
  ];
  return (
    <div>
      <div className="page-heading">
        <Title>Dashboard</Title>
      </div>
      <p className="mb-6 text-gray-500">
        Sizga ochiq bo'lgan loyihalar va ish jarayonlari.
      </p>
      <Notice
        error={error}
        loading={loading}
        onRetry={() => setRevision((v) => v + 1)}
      />
      {!loading && !error && (
        <div className="dashboard-cards">
          {cards.map(([label, type, Icon]) => (
            <Link to={`/${type}`} className="dashboard-card-link" key={type}>
              <Surface className="settings-card">
                <Icon className="mb-4 text-2xl text-[#C6A47E]" />
                <p>{label}</p>
                <strong className="block mt-2 text-3xl">{stats[type]}</strong>
              </Surface>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
