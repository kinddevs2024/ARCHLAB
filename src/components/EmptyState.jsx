export function EmptyState({
  title = "Ma'lumot yo'q",
  text = "Bu bo'limda hali yozuvlar mavjud emas.",
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-[#d9dde6] bg-white p-8 text-center">
      <h3 className="text-lg font-bold text-[#20242a]">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-[#6b7280]">{text}</p>
    </div>
  );
}
