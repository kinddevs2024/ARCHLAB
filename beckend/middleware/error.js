export const notFoundHandler = (_req, res) => {
  res.status(404).json({ message: "API route topilmadi", code: "NOT_FOUND" });
};

export const errorHandler = (error, _req, res, _next) => {
  if (error.name === "ZodError") {
    res.status(400).json({
      message: "Ma'lumotlarni tekshiring",
      code: "VALIDATION_ERROR",
      fields: error.flatten?.().fieldErrors,
    });
    return;
  }

  if (error.code === 11000) {
    res
      .status(409)
      .json({ message: "Bunday yozuv allaqachon mavjud", code: "DUPLICATE" });
    return;
  }

  if (["CastError", "ValidationError", "SyntaxError"].includes(error.name))
    return res
      .status(400)
      .json({ message: "Ma'lumotlarni tekshiring", code: "VALIDATION_ERROR" });
  if (error.name === "MulterError")
    return res
      .status(error.code === "LIMIT_FILE_SIZE" ? 413 : 400)
      .json({
        message:
          error.code === "LIMIT_FILE_SIZE"
            ? "Fayl hajmi juda katta"
            : "Fayl yuklashda xatolik",
        code: error.code,
      });
  const status = error.status || 500;
  if (status >= 500) console.error("API failure", error.name);
  res.status(status).json({
    message: status >= 500 ? "Serverda xatolik yuz berdi" : error.message,
    code: error.code || "SERVER_ERROR",
    fields: error.fields,
  });
};
