import { badRequest } from "./apiError.js";
export const getPagination = (query) => {
  const page = Number(query.page ?? 1),
    limit = Number(query.limit ?? 20);
  if (
    !Number.isInteger(page) ||
    page < 1 ||
    page > 100000 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100
  )
    throw badRequest("Sahifa yoki limit noto'g'ri");
  return { page, limit, skip: (page - 1) * limit };
};
export const paged = (data, total, page, limit) => ({
  data,
  meta: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
});
