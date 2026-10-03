import { AuditLog } from "../models/AuditLog.js";
export const writeAudit = async (
  req,
  action,
  entity,
  entityId,
  details = {},
) => {
  try {
    await AuditLog.create({
      actor: req.user?.id || req.auditActor,
      action,
      entity,
      entityId: entityId ? String(entityId) : undefined,
      details,
      ip: req.clientIp || req.ip,
    });
  } catch (error) {
    console.error("Audit write failed", error.name);
  }
};
