const labels = {
  new: "Yangi",
  in_progress: "Jarayonda",
  done: "Tayyorlandi",
  archived: "Arxiv",
  todo: "Yangi",
  draft: "Qoralama",
  active: "Faol",
};
export function StatusBadge({ value }) {
  return (
    <span className={`status-badge status-${value}`}>
      {labels[value] || value}
    </span>
  );
}
