import { FaPen, FaFolderOpen, FaDownload } from "react-icons/fa";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { StatusBadge } from "./StatusBadge";
export function RecordPreview({
  item,
  title,
  fields = [],
  onClose,
  onEdit,
  onWorkspace,
  onDownload,
}) {
  return (
    <Modal
      open={!!item}
      title={title || item?.title || item?.originalName || "Ma'lumot"}
      onClose={onClose}
    >
      <div className="record-preview">
        {item?.status && <StatusBadge value={item.status} />}
        <dl className="record-details">
          {fields
            .filter(
              ([, value]) =>
                value !== undefined && value !== null && value !== "",
            )
            .map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{String(value)}</dd>
              </div>
            ))}
        </dl>
        <div className="record-actions">
          {onEdit && (
            <Button onClick={onEdit}>
              <FaPen /> Tahrirlash
            </Button>
          )}
          {onDownload && (
            <Button onClick={onDownload}>
              <FaDownload /> Yuklab olish
            </Button>
          )}
          {onWorkspace && (
            <Button variant="secondary" onClick={onWorkspace}>
              <FaFolderOpen /> Papkalar va hujjatlar
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            Yopish
          </Button>
        </div>
      </div>
    </Modal>
  );
}
