import { api } from "./client";
export async function projectOptions() {
  let page = 1,
    data = [];
  while (true) {
    const { data: result } = await api.get("/api/projects", {
      params: { page, limit: 100 },
    });
    data.push(...result.data);
    if (page >= result.meta.pages) return { data: { data } };
    page++;
  }
}
