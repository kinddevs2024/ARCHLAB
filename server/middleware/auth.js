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
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      throw new ApiError(401, "Avtorizatsiya kerak", "UNAUTHORIZED");
    }

    const payload = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(payload.id);

    if (!user || !user.active) {
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
