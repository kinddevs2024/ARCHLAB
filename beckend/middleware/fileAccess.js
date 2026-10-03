import { File } from "../models/File.js";
import { ProjectFolder } from "../models/ProjectFolder.js";
import { Contract } from "../models/Contract.js";
import { Letter } from "../models/Letter.js";
import { Order } from "../models/Order.js";
import {
  isAdmin,
  isManager,
  checkProject,
  conversationFor,
  visibleProjectIds,
} from "./access.js";
import { forbidden, notFound } from "../utils/apiError.js";
import { requireId } from "../utils/validation.js";
const entities = {
  contracts: Contract,
  letters: Letter,
  orders: Order,
  "project-folders": ProjectFolder,
};
export const fileAccess = async (user, file, write = false) => {
  if (file.kind === "avatar") {
    if (write && file.entityId !== user.id && !isAdmin(user)) throw forbidden();
    return;
  }
  if (file.conversation || file.entityType === "conversations") {
    await conversationFor(user, file.conversation || file.entityId);
    if (
      write &&
      file.uploadedBy &&
      String(file.uploadedBy) !== user.id &&
      !isAdmin(user)
    )
      throw forbidden();
    return;
  }
  if (
    (file.entityType === "contracts" || file.kind === "contract") &&
    !isManager(user)
  )
    throw forbidden();
  let project = file.project;
  if (file.entityType === "projects") {
    project = file.entityId;
  } else if (entities[file.entityType]) {
    requireId(file.entityId);
    const item = await entities[file.entityType].findOne({
      _id: file.entityId,
      deletedAt: null,
    });
    if (!item) throw notFound();
    project = item.project;
  }
  if (project) {
    await checkProject(user, project);
    if (file.project && String(file.project) !== String(project))
      throw forbidden("Fayl loyihasi mos emas");
    file.project = project;
  } else if (!isAdmin(user)) throw forbidden();
  if (
    write &&
    user.status === "User" &&
    file.uploadedBy &&
    String(file.uploadedBy) !== user.id
  )
    throw forbidden();
  if (file.folder) {
    const folder = await ProjectFolder.findOne({
      _id: requireId(file.folder),
      project,
      deletedAt: null,
    });
    if (!folder) throw notFound("Papka topilmadi");
  }
};
export const visibleFileFilter = async (user) => {
  const ids = await visibleProjectIds(user);
  const clauses = [
    { kind: "avatar" },
    { project: { $in: ids }, entityType: { $in: ["", null] } },
    { entityType: "projects", entityId: { $in: ids.map(String) } },
  ];
  for (const [type, Model] of Object.entries(entities)) {
    if (type === "contracts" && !isManager(user)) continue;
    const linked = await Model.find({
      deletedAt: null,
      ...(isAdmin(user) ? {} : { project: { $in: ids } }),
    }).select("_id");
    clauses.push({
      entityType: type,
      entityId: { $in: linked.map((x) => String(x._id)) },
    });
  }
  const { Conversation } = await import("../models/Conversation.js");
  const chats = await Conversation.find({ participants: user.id }).select(
    "_id",
  );
  clauses.push({ conversation: { $in: chats.map((c) => c._id) } });
  if (isAdmin(user))
    clauses.push({
      conversation: null,
      kind: { $ne: "avatar" },
      entityType: { $ne: "conversations" },
    });
  return isManager(user)
    ? { $or: clauses }
    : {
        $and: [
          { $or: clauses },
          { entityType: { $ne: "contracts" }, kind: { $ne: "contract" } },
        ],
      };
};
export const fileFor = async (
  user,
  id,
  write = false,
  includeDeleted = false,
) => {
  const file = await File.findOne({
    _id: requireId(id),
    ...(includeDeleted ? {} : { deletedAt: null }),
  });
  if (!file) throw notFound("Fayl topilmadi");
  await fileAccess(user, file, write);
  return file;
};
