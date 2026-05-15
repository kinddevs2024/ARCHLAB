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
    res.status(409).json({ message: "Bunday yozuv allaqachon mavjud", code: "DUPLICATE" });
    return;
  }

  const status = error.status || 500;
  res.status(status).json({
    message: error.message || "Serverda xatolik yuz berdi",
    code: error.code || "SERVER_ERROR",
    fields: error.fields,
  });
};
