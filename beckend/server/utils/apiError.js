export class ApiError extends Error {
  constructor(status, message, code = "ERROR", fields = undefined) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

export const badRequest = (message, fields) =>
  new ApiError(400, message, "BAD_REQUEST", fields);

export const forbidden = (message = "Bu amal uchun ruxsat yo'q") =>
  new ApiError(403, message, "FORBIDDEN");

export const notFound = (message = "Ma'lumot topilmadi") =>
  new ApiError(404, message, "NOT_FOUND");
