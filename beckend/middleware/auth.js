import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { User } from "../models/User.js";
import { ApiError, forbidden } from "../utils/apiError.js";

const rank = {
  Owner: 4,
  Admin: 3,
  Manager: 2,
  User: 1,
};

export const authRequired = async (req, _res, next) => {
  try {
    const cookie = (req.headers.cookie || "").split(";").map((part) => part.trim()).find((part) => part.startsWith("archlab_session="));
    const token = cookie ? cookie.slice("archlab_session=".length) : null;

    if (!token) {
      throw new ApiError(401, "Avtorizatsiya kerak", "UNAUTHORIZED");
    }

    const payload = jwt.verify(token, config.jwtSecret, { algorithms: ["HS256"] });
    const user = await User.findById(payload.id).select("+sessionVersion");

    if (!user || !user.active || payload.version !== user.sessionVersion) {
      throw new ApiError(401, "Profil topilmadi yoki bloklangan", "UNAUTHORIZED");
    }

    req.user = user.toPublic();
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      next(new ApiError(401, "Sessiya tugagan. Qayta kiring", "UNAUTHORIZED"));
      return;
    }
    next(error);
  }
};

export const requireRole = (allowedRoles) => (req, _res, next) => {
  const userRole = req.user?.status || "User";
  const minRank = Math.min(...allowedRoles.map((role) => rank[role] || 0));

  if ((rank[userRole] || 0) < minRank) {
    next(forbidden());
    return;
  }

  next();
};
