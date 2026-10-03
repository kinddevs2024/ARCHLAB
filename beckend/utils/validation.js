import mongoose from "mongoose";
import { z } from "zod";
import { badRequest } from "./apiError.js";
export const objectId = z.string().regex(/^[a-f\d]{24}$/i, "ID noto'g'ri");
export const optionalId = z
  .union([objectId, z.literal(""), z.null()])
  .optional()
  .transform((v) => v || undefined);
export const optionalDate = z.preprocess(
  (v) => (v === "" || v == null ? undefined : v),
  z.coerce.date().optional(),
);
export const money = z.coerce.number().finite().nonnegative().max(1e15);
export const patchData = (schema, body) =>
  Object.fromEntries(
    Object.entries(schema.partial().parse(body)).filter(([key]) =>
      Object.hasOwn(body, key),
    ),
  );
export const literalSearch = (value) =>
  new RegExp(
    String(value || "")
      .slice(0, 120)
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    "i",
  );
// Every word can match a different field, while all regular-expression characters remain literal.
export const searchFilter = (value, fields) => {
  const words = String(value || "")
    .normalize("NFKC")
    .trim()
    .slice(0, 120)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 8);
  return {
    $and: words.map((word) => ({
      $or: fields.map((field) => ({ [field]: literalSearch(word) })),
    })),
  };
};
export const requireId = (id) => {
  if (!mongoose.isValidObjectId(id) || !/^[a-f\d]{24}$/i.test(String(id)))
    throw badRequest("ID noto'g'ri");
  return id;
};
export const yearFilter = (year) => {
  const n = Number(year);
  if (!Number.isInteger(n) || n < 1900 || n > 2200)
    throw badRequest("Yil noto'g'ri");
  return {
    $gte: new Date(Date.UTC(n, 0, 1)),
    $lt: new Date(Date.UTC(n + 1, 0, 1)),
  };
};
