import { ArrowDownTrayIcon, DocumentIcon, TrashIcon } from "@heroicons/react/24/outline";

interface MediaType {
    images: string[];
    video: string[];
    documents: string[];
    allFiles: string[];
    deleteItems: (index: number, type: string) => void;
    blocking: boolean
}


export default function MediaRender({ images, video, documents, allFiles, deleteItems, blocking }: MediaType) {
    return (
        <div>
            <h2 className="my-4 text-lg font-bold">Медиафайлы</h2>
            <div className="grid grid-cols-6 gap-4">
                {images.map((image, index) => (
                <div
                    key={index}
                    className="relative group overflow-hidden rounded-md w-full h-48" // фиксируем высоту
                >
                    <img
                    src={image}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300" // всегда заполняет контейнер, сохраняя пропорции
                    alt={`image-${index}`}
                    />
                    <div
                    className="absolute inset-0 bg-black/50 flex items-center justify-center
                                opacity-0 group-hover:opacity-100 transition duration-300 group-hover:scale-110 cursor-pointer"
                    >
                    <button onClick={() => deleteItems(index, "image")} className="rounded-full p-2 hover:bg-red-600 hover:scale-110 transition duration-300">
                        <TrashIcon className="h-5 w-5 text-white" />
                    </button>
                    </div>
                </div>
                ))}
                {video.map((vid, index) => (
                <div
                    key={index}
                    className="relative group overflow-hidden rounded-md w-full h-48"
                    >
                    <video
                        src={vid}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
                        // controls
                        muted
                        autoPlay
                        loop
                    />
                    <div
                        className="absolute inset-0 bg-black/50 flex items-center justify-center
                                opacity-0 group-hover:opacity-100 transition duration-300 group-hover:scale-110 cursor-pointer"
                    >
                        <button onClick={() => deleteItems(index, "video")} className="rounded-full p-2 hover:bg-red-600 hover:scale-110 transition duration-300">
                        <TrashIcon className="h-5 w-5 text-white" />
                        </button>
                    </div>
                    </div>
                ))}
                {documents.map((doc, index) => (
                <div
                    key={index}
                    className="relative border border-primary/50 group overflow-hidden rounded-md w-full h-48 bg-base-200 flex flex-col items-center justify-center"
                >
                    <DocumentIcon className="h-12 w-12 text-gray-500 mb-2" />

                    <span className="text-sm line-clamp-3 w-full text-center">{doc.split("/").pop()}</span>
                    <div
                    className="absolute inset-0 bg-black/50 flex items-center justify-center flex-col gap-5
                                opacity-0 group-hover:opacity-100 transition duration-300 group-hover:scale-110 cursor-pointer"
                    >
                    <button
                        onClick={() => deleteItems(index, "document")}
                        className="rounded-full p-2 hover:bg-red-600 hover:scale-110 transition duration-300"
                    >
                        <TrashIcon className="h-5 w-5 text-white" />
                    </button>
                    <a href={doc} target="_blank" rel="noopener noreferrer" className="rounded-full p-2 hover:bg-success hover:scale-110 transition duration-300">
                        <ArrowDownTrayIcon className="h-5 w-5 text-white" />
                    </a>
                    </div>
                </div>
                ))}

                {allFiles.map((file, index) => (
                <div
                    key={index}
                    className="relative border border-primary/50 group overflow-hidden rounded-md w-full h-48 bg-base-200 flex flex-col items-center justify-center"
                >
                    <DocumentIcon className="h-12 w-12 text-gray-500 mb-2" />

                    <span className="text-sm line-clamp-3 w-full text-center">{file.split("/").pop()}</span>
                    <div
                    className="absolute inset-0 bg-black/50 flex items-center justify-center flex-col gap-5
                                opacity-0 group-hover:opacity-100 transition duration-300 group-hover:scale-110 cursor-pointer"
                    >
                    <button
                        onClick={() => deleteItems(index, "file")}
                        className="rounded-full p-2 hover:bg-red-600 hover:scale-110 transition duration-300"
                    >
                        <TrashIcon className="h-5 w-5 text-white" />
                    </button>
                    <a href={file} target="_blank" rel="noopener noreferrer" className="rounded-full p-2 hover:bg-success hover:scale-110 transition duration-300">
                        <ArrowDownTrayIcon className="h-5 w-5 text-white" />
                    </a>
                    </div>
                </div>
                ))}
            </div>
            <div className="mt-4 text-lg text-base-content">
                {images.length + video.length + documents.length > 3 && <p className="text-red-600">Максимальное количество медиафайлов: 3</p>}
                {blocking && <p className="text-red-600">Нельзя отправить документ вместе с другими медиафайлами</p>}
            </div> 
        </div>
    )
}