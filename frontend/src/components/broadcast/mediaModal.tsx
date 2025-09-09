import { DocumentIcon } from "@heroicons/react/24/outline";
import type { MediaType } from "../../interface/types";

interface MediaModal {
    mediaLoading: boolean;
    mediaList: MediaType[];
    setMediaList: React.Dispatch<React.SetStateAction<MediaType[]>>;
    setMediaModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    addMediaToAttachments: (filePath: string) => void;
    getMediaType: (url: string) => string;
    mediaDeleting: number | null;
    deleteMedia: (id: number) => void;
}

export default function MediaModal({mediaLoading, mediaList, setMediaList, setMediaModalOpen, addMediaToAttachments, getMediaType, mediaDeleting, deleteMedia}: MediaModal) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-base-100 w-full max-w-4xl p-4 md:p-6 rounded shadow-lg">
                <div className="flex items-center justify-between mb-3">
                <div>
                    <h3 className="font-bold text-lg">Медиатека</h3>
                    <p className="text-sm text-base-content/70">Файлы, загруженные в систему</p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="btn btn-ghost btn-sm" onClick={() => { setMediaModalOpen(false); setMediaList([]); }}>
                    Закрыть
                    </button>
                </div>
                </div>

                {mediaLoading ? (
                <div className="p-8 text-center">
                    <div className="mb-2">Загрузка...</div>
                    <div className="loading loading-spinner"></div>
                </div>
                ) : mediaList.length === 0 ? (
                <div className="p-4 text-center text-sm text-base-content/60">Медиатеках пуста</div>
                ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto">
                    {mediaList.map((m) => {
                    const type = getMediaType(m.file_path);
                    return (
                        <div key={m.id} className="card bg-base-200 p-3 shadow relative">
                        <div className="mb-2">
                            {type === "image" ? (
                            <img src={m.file_path} alt={m.file_name} className="w-full h-40 object-cover rounded" />
                            ) : type === "video" ? (
                            <video src={m.file_path} className="w-full h-40 object-cover rounded" muted controls={false} />
                            ) : (
                            <div className="flex flex-col items-center justify-center h-40 border rounded bg-base-100 p-4">
                                <DocumentIcon className="h-10 w-10 text-gray-500" />
                                <div className="mt-2 text-sm text-center line-clamp-2">{m.file_name}</div>
                            </div>
                            )}
                        </div>

                        <div className="text-xs text-base-content/60 mb-2">
                            {m.file_name} • {(m.file_size).toFixed(1)} KB
                        </div>

                        <div className="flex justify-between gap-2">
                            <button className="btn btn-sm btn-outline" onClick={() => addMediaToAttachments(m.file_path)}>
                            Добавить
                            </button>
                            <a className="btn btn-sm btn-ghost" href={m.file_path} target="_blank" rel="noreferrer">Открыть</a>
                            <button className="btn btn-sm btn-error" onClick={() => deleteMedia(m.id)} disabled={mediaDeleting === m.id}>
                            {mediaDeleting === m.id ? "Удаление..." : "Удалить"}
                            </button>
                        </div>
                        <div className="absolute top-2 right-2 text-[10px] text-base-content/60">{new Date(m.created_at).toLocaleString()}</div>
                        </div>
                    );
                    })}
                </div>
                )}
            </div>
            </div>
    )
}