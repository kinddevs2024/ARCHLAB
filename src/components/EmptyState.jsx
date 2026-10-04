import { Surface } from "./DesignSystem";
export function EmptyState({
  title = "Ma'lumot yo'q",
  text = "Bu bo'limda hali yozuvlar mavjud emas.",
}) {
  return (
    <Surface className="empty-state">
      <h3>{title}</h3>
      <p>{text}</p>
    </Surface>
  );
}
