import { useEffect, useState } from "react";
import { FaFolderOpen, FaTasks, FaEnvelope, FaUsers } from "react-icons/fa";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { hasRole } = useAuth();
  const [stats, setStats] = useState({ projects: 0, tasks: 0, files: 0, users: 0 });

  useEffect(() => {
    const load = async () => {
      const [projects, tasks, files, users] = await Promise.allSettled([
        api.get("/api/projects?limit=1"),
        api.get("/api/tasks?limit=1"),
        api.get("/api/files?limit=1"),
        hasRole("Owner") ? api.get("/api/users?limit=1") : Promise.resolve({ data: { meta: { total: 0 } } }),
      ]);
      setStats({
        projects: projects.value?.data?.meta?.total || 0,
        tasks: tasks.value?.data?.meta?.total || 0,
        files: files.value?.data?.meta?.total || 0,
        users: users.value?.data?.meta?.total || 0,
      });
    };
    load();
  }, [hasRole]);

  const cards = [
    ["Loyihalar", stats.projects, FaFolderOpen],
    ["Vazifalar", stats.tasks, FaTasks],
    ["Fayllar", stats.files, FaEnvelope],
    ["Foydalanuvchilar", stats.users, FaUsers],
  ];

  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold">Dashboard</h1>
      <p className="mb-6 text-[#6b7280]">ARCH LAB ish jarayonlari bo'yicha qisqa ko'rsatkichlar.</p>
      <div className="grid gap-4 md:grid-cols-4">
        {cards.map(([label, value, Icon]) => (
          <div className="rounded-xl border border-[#e6e9f0] bg-white p-5 shadow-sm" key={label}>
            <Icon className="mb-4 text-2xl text-[#C6A47E]" />
            <p className="text-sm text-[#6b7280]">{label}</p>
            <p className="mt-1 text-3xl font-bold">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
