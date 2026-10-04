import { Badge } from "./DesignSystem";
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
    <Badge className={`status-badge status-${value}`}>
      {labels[value] || value}
    </Badge>
  );
}
