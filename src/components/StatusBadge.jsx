const projectStatus = {
  new: ["Yangi", "bg-blue-50 text-blue-700"],
  in_progress: ["Jarayonda", "bg-amber-50 text-amber-700"],
  done: ["Tayyor", "bg-green-50 text-green-700"],
  archived: ["Arxiv", "bg-gray-100 text-gray-600"],
};

const taskStatus = {
  todo: ["Yangi", "bg-blue-50 text-blue-700"],
  in_progress: ["Jarayonda", "bg-amber-50 text-amber-700"],
  done: ["Bajarildi", "bg-green-50 text-green-700"],
  archived: ["Arxiv", "bg-gray-100 text-gray-600"],
};

export function StatusBadge({ value, type = "project" }) {
  const source = type === "task" ? taskStatus : projectStatus;
  const [label, color] = source[value] || [value || "-", "bg-gray-100 text-gray-600"];

  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${color}`}>{label}</span>;
}
