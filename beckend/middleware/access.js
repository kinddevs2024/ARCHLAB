import { Project } from "../models/Project.js";
import { Conversation } from "../models/Conversation.js";
import { User } from "../models/User.js";
import { badRequest, forbidden, notFound } from "../utils/apiError.js";
import { requireId } from "../utils/validation.js";
export const isAdmin = (user) => ["Owner", "Admin"].includes(user?.status);
export const isManager = (user) => isAdmin(user) || user?.status === "Manager";
export const projectScope = (user) =>
  isAdmin(user)
    ? {}
    : {
        $or: [
          { assignedTo: user.id },
          { helper: user.id },
          { master: user.id },
        ],
      };
export const visibleProjectIds = async (user) =>
  (
    await Project.find({ ...projectScope(user), deletedAt: null }).select("_id")
  ).map((p) => p._id);
export const checkProject = async (user, id, includeDeleted = false) => {
  requireId(id);
  const project = await Project.findOne({
    _id: id,
    ...projectScope(user),
    ...(includeDeleted ? {} : { deletedAt: null }),
  });
  if (!project) throw notFound("Loyiha topilmadi yoki ruxsat yo'q");
  return project;
};
export const conversationFor = async (user, id) => {
  requireId(id);
  const conversation = await Conversation.findOne({
    _id: id,
    participants: user.id,
  });
  if (!conversation) throw notFound("Chat topilmadi yoki ruxsat yo'q");
  return conversation;
};
export const validAssignees = async (data) => {
  const ids = [
    ...(data.assignedTo || []),
    data.assignee,
    data.helper,
    data.master,
  ].filter(Boolean);
  if (!ids.length) return;
  ids.forEach(requireId);
  if (
    (await User.countDocuments({
      _id: { $in: [...new Set(ids)] },
      active: true,
    })) !== new Set(ids).size
  )
    throw badRequest("Xodim topilmadi yoki bloklangan");
};
export const adminOnly = (req, _res, next) =>
  isAdmin(req.user) ? next() : next(forbidden());
export const managerOnly = (req, _res, next) =>
  isManager(req.user) ? next() : next(forbidden());
