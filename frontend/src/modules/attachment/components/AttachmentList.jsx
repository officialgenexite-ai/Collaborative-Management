export default function AttachmentList({ attachments, currentUserId, myWorkspaceRole, onDelete }) {
  const isImage = (fileType) => fileType?.startsWith('image/');

  const canDelete = (attachment) => {
    const isUploader = (attachment.uploadedBy?._id || attachment.uploadedBy) === currentUserId;
    const isOwnerOrAdmin = myWorkspaceRole === 'Owner' || myWorkspaceRole === 'Admin';
    return isUploader || isOwnerOrAdmin;
  };

  if (!attachments || attachments.length === 0) {
    return <p className="text-xs text-gray-400">No attachments yet</p>;
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {attachments.map((a) => (
        <div key={a._id} className="relative group border border-gray-200 rounded-lg overflow-hidden">
          <a href={a.fileUrl} target="_blank" rel="noopener noreferrer" className="block">
            {isImage(a.fileType) ? (
              <img src={a.fileUrl} alt={a.fileName} className="w-full h-20 object-cover" />
            ) : (
              <div className="w-full h-20 flex items-center justify-center bg-gray-50 text-2xl">📄</div>
            )}
          </a>
          <p className="text-[10px] text-gray-500 px-1 py-0.5 truncate">{a.fileName}</p>
          {canDelete(a) && (
            <button
              onClick={() => onDelete(a._id)}
              className="absolute top-1 right-1 bg-white/90 rounded-full w-5 h-5 text-xs text-red-500 opacity-0 group-hover:opacity-100 transition"
            >
              ✕
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
