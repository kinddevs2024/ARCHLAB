import { AuditLog } from "../models/AuditLog.js";

export const writeAudit = async (req, action, entity, entityId, details = {}) => {
  await AuditLog.create({
    actor: req.user?.id,
    action,
    entity,
    entityId: entityId ? String(entityId) : undefined,
    details,
    ip: req.ip,
  });
};
