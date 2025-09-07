import { ArrowDownTrayIcon, DocumentIcon, FilmIcon, PhotoIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { useAppContext } from "../layout/AppLayout";
import api from "../script/apiFetch";
import ModalUsers from "../components/setting/modalUsers";

// const testData = [
//   'https://drawinspire.com/img/anime/anime62.png',
//   'https://cdna.artstation.com/p/assets/images/images/065/656/154/large/nicky-00154-687477267.jpg?1690904109',
//   'https://t3.ftcdn.net/jpg/04/49/19/08/360_F_449190831_i2whvIQdDIGtuIVWT6QfenWwmRApVJ5l.jpg'
// ]

export default function Sender() {
  const context = useAppContext();
  const { data, callToast } = context;

  const [message, setMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [audience, setAudience] = useState<"all" | "user">("all");
  const [images, setImages] = useState<string[]>([]);
  const [video, setVideo] = useState<string[]>([]);
  const [documents, setDocuments] = useState<string[]>([]);
  const [allFiles, setAllFiles] = useState<string[]>([]);

  // Новое: медиатека
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaDeleting, setMediaDeleting] = useState<number | null>(null);

  const blocking = (images.length > 0 ? 1 : 0) + (video.length > 0 ? 1 : 0) + (documents.length > 0 ? 1 : 0) + (allFiles.length > 0 ? 1 : 0) > 1

  // Новый: состояние поиска в модалке
  const [searchQuery, setSearchQuery] = useState("");


  const sendToUsers = async () => {
    const docs = [...documents, ...allFiles];
    const payload = {
      to: audience === "all" ?
      data?.users.map((u) => u.chat_id) 
      : 
      data?.users
        .filter((u) => selectedIds.includes(u.id))
        .map((u) => u.chat_id),
      message,
      images,
      video,
      docs 
    };
    await api.post("/bot/broadcast", payload);
    // Сброс формы
    setMessage("");
    setSelectedIds([]);
    setIsModalOpen(false);
    setAudience("all");
    setSearchQuery("");
    setImages([]);
    setVideo([]);
    setDocuments([]);
    setAllFiles([]);
    callToast("success", "Рассылка отправлена", 5000);
    // Здесь можно показать уведомление об успехе
  };        

  const uploadFile = async (e: any) => {
    const file = e.target.files[0];

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      callToast("error", "Размер файла превышает 50MB", 5000);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/api/upload", formData);
    if (response.status === 200) {
      if (response.data.type === "images") {
        setImages((prev) => [...prev, response.data.url]);
      } else if (response.data.type === "videos") {
        setVideo((prev) => [...prev, response.data.url]);
      } else if (response.data.type === "documents") {
        setDocuments((prev) => [...prev, response.data.url]);
      } else {
        setAllFiles((prev) => [...prev, response.data.url]);
      }
      callToast("success", "Файл успешно загружен", 5000);
    } else {
      callToast("error", "Ошибка загрузки файла", 5000);
    }
  };

  // Вспомогательная функция: тип медиа по расширению
  const getMediaType = (url: string) => {
    const u = url.split("?")[0].toLowerCase();
    if (u.match(/\.(jpe?g|png|gif|webp|bmp|svg)$/)) return "image";
    if (u.match(/\.(mp4|mov|webm|ogg|mkv)$/)) return "video";
    return "document";
  };

  // Загрузка медиатеки
  const fetchMedia = async () => {
    setMediaLoading(true);
    try {
      const res = await api.get("/api/media");
      if (res.status === 200) {
        setMediaList(res.data || []);
      } else {
        callToast("error", "Не удалось получить список медиа", 3000);
      }
    } catch (e) {
      callToast("error", "Ошибка при загрузке медиа", 3000);
    } finally {
      setMediaLoading(false);
    }
  };

  // Открыть медиатеку (подгрузка)
  const openMediaModal = () => {
    setMediaModalOpen(true);
    fetchMedia();
  };

  // Удалить медиа из БД
  const deleteMedia = async (id: number) => {
    const ok = confirm("Удалить файл из медиатеки? Это действие нельзя отменить.");
    if (!ok) return;
    setMediaDeleting(id);
    try {
      const res = await api.delete(`/api/media/${id}`);
      if (res.status === 200 || res.status === 204) {
        setMediaList(prev => prev.filter(m => m.id !== id));
        callToast("success", "Файл удалён", 3000);
      } else {
        callToast("error", "Ошибка удаления", 3000);
      }
    } catch {
      callToast("error", "Не удалось удалить файл", 3000);
    } finally {
      setMediaDeleting(null);
    }
  };

  // Добавить файл из медиатеки в текущие вложения
  const addMediaToAttachments = (filePath: string) => {
    const type = getMediaType(filePath);
    if (type === "image") setImages(prev => [...prev, filePath]);
    else if (type === "video") setVideo(prev => [...prev, filePath]);
    else setDocuments(prev => [...prev, filePath]);
    callToast("success", "Файл добавлен к вложениям", 1500);
  };

  const deleteItems = (index: number, type: string) => {
    if (type === "image") {
      setImages((prev) => prev.filter((_, i) => i !== index));
    } else if (type === "video") {
      setVideo((prev) => prev.filter((_, i) => i !== index));
    } else if (type === "document") {
      setDocuments((prev) => prev.filter((_, i) => i !== index));
    } else if (type === "file") {
      setAllFiles((prev) => prev.filter((_, i) => i !== index));
    }
    
  };
  const addUrlImage = (url: string) => {
    setImages((prev) => [...prev, url]);
  };

  return (
    <div className="text-base-content w-full">
      <div className="container mx-auto py-8">
        <div className="navbar bg-base-100 rounded-box mb-8 shadow">
          <div className="flex-1">
            <span className="text-xl font-bold">Создать рассылку</span>
          </div>
        </div>

        <div className="mx-auto max-w-3xl">
          <h2 className="mb-6 text-3xl font-bold">Создание рассылки</h2>

          <div className="space-y-8">
            <div>
              <label className="mb-2 block text-sm font-medium">Сообщение</label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="textarea textarea-bordered w-full resize-none bg-base-200"
                placeholder="Введите текст сообщения"
              />
            </div>

            <div>
              <span className="mb-2 block text-sm font-medium">Медиафайлы</span>
              <input type="file" id="fileInputImage" onChange={uploadFile} hidden accept="image/*" />
              <input type="file" id="fileInputVideo" onChange={uploadFile} hidden accept="video/*" />
              <input type="file" id="fileInputFile" onChange={uploadFile} hidden accept="application/*" />
              <div className="flex items-center gap-4">
                <button className="btn btn-outline" onClick={() => document.getElementById("fileInputImage")?.click()}>
                  <PhotoIcon className="h-5 w-5" />
                  <span>Добавить фото</span>
                </button>

                {/* Новая кнопка: открыть медиатеку */}
                <button className="btn btn-outline" onClick={openMediaModal}>
                  <PhotoIcon className="h-5 w-5" />
                  <span>Из медиатеки</span>
                </button>

                <div className="flex items-center gap-2" >
                  <PhotoIcon className="h-5 w-5" />
                  <span>URL</span>
                  <input 
                    type="text" 
                    className="input outline-none focus:border-none focus:ring-0" 
                    onKeyDown={(e) => e.key === "Enter" && (
                      addUrlImage(e.currentTarget.value),
                      e.currentTarget.value = ""
                    )} 
                  />
                </div>
                <button className="btn btn-outline" onClick={() => document.getElementById("fileInputVideo")?.click()}>
                    <FilmIcon className="h-5 w-5" />
                  <span>Добавить видео</span>
                </button>
                <button className="btn btn-outline" onClick={() => document.getElementById("fileInputFile")?.click()}>
                    <DocumentIcon className="h-5 w-5" />
                  <span>Добавить документ</span>
                </button>
              </div>
              <div>
                {(images.length > 0 || video.length > 0 || documents.length > 0 || allFiles.length > 0 ) && (
                  <>
                  <h2 className="my-4 text-lg font-bold">Медиафайлы</h2>
                    <div className="grid grid-cols-3 gap-4">
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
                  </>
                )}
                
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-lg font-bold">Целевая аудитория</h3>
              <div className="space-y-3">
                <label className="flex cursor-pointer items-center gap-4 rounded-md border p-4">
                  <input
                    name="audience"
                    type="radio"
                    checked={audience === "all"}
                    onChange={() => {
                      setAudience("all");
                      setIsModalOpen(false);
                      setSearchQuery("");
                    }}
                    className="radio"
                  />
                  <span className="text-sm font-medium">Все пользователи</span>
                </label>

                <label className="flex cursor-pointer items-center gap-4 rounded-md border p-4">
                  <input
                    name="audience"
                    type="radio"
                    checked={audience === "user"}
                    onChange={() => {
                      setAudience("user");
                      setIsModalOpen(true);
                    }}
                    className="radio"
                  />
                  <span className="text-sm font-medium">Пользователю</span>
                </label>
                <div className="text-sm text-base-content/60">
                  {audience === "user" && selectedIds.length > 0 && (
                    <div>Выбрано: {selectedIds.length} пользователь(я)</div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                className="btn btn-primary btn-soft"
                onClick={sendToUsers}
                disabled={
                  blocking ||
                  (audience === "user" && selectedIds.length === 0) ||
                  (message === "" && images.length === 0 && video.length === 0 && documents.length === 0 && allFiles.length === 0)
                }
              >
                Отправить рассылку
              </button>
            </div>
          </div>
        </div>

        {/* Модальное окно выбора пользователей */}
        <ModalUsers
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
          data={data}
        />

        {/* Модалка медиатеки */}
        {mediaModalOpen && (
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
        )}
      </div>
    </div>
  );
}