import { DocumentIcon, FilmIcon, PhotoIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { useAppContext } from "../layout/AppLayout";
import api from "../script/apiFetch";
import ModalUsers from "../components/setting/modalUsers";
import HeaderPageTitle from "../components/headerPage";
import type { MediaType } from "../interface/types";
import MediaRender from "../components/broadcast/mediaRender";
import MediaModal from "../components/broadcast/mediaModal";
import UserSelectBroadcast from "../components/broadcast/userSelect";
import useTitle from "../script/useTitle";

// const testData = [
//   'https://drawinspire.com/img/anime/anime62.png',
//   'https://cdna.artstation.com/p/assets/images/images/065/656/154/large/nicky-00154-687477267.jpg?1690904109',
//   'https://t3.ftcdn.net/jpg/04/49/19/08/360_F_449190831_i2whvIQdDIGtuIVWT6QfenWwmRApVJ5l.jpg'
// ]

export default function Sender() {
  useTitle("Рассылка");
  const context = useAppContext();
  const { data, callToast, botSetting } = context;

  const [message, setMessage] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [audience, setAudience] = useState<"all" | "user">("all");
  const [images, setImages] = useState<string[]>([]);
  const [video, setVideo] = useState<string[]>([]);
  const [documents, setDocuments] = useState<string[]>([]);
  const [allFiles, setAllFiles] = useState<string[]>([]);

  // Новое: медиатека
  const [mediaModalOpen, setMediaModalOpen] = useState<boolean>(false);
  const [mediaList, setMediaList] = useState<MediaType[]>([]);
  const [mediaLoading, setMediaLoading] = useState<boolean>(false);
  const [mediaDeleting, setMediaDeleting] = useState<number | null>(null);

  const blocking = (images.length > 0 ? 1 : 0) + (video.length > 0 ? 1 : 0) + (documents.length > 0 ? 1 : 0) + (allFiles.length > 0 ? 1 : 0) > 1

  const [searchQuery, setSearchQuery] = useState<string>("");


  const sendToUsers = async () => {
    if (!botSetting) {
      callToast("error", "Бот не выбран", 5000);
      return;
    }
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
    await api.post(`/api/broadcast/${botSetting.name}`, payload);
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
        <HeaderPageTitle title="Рассылка" />

        <div className="mb-8 ">
          <h2 className="mb-6 text-3xl font-bold">Создание рассылки</h2>

          <div className="space-y-8 shadow-md p-6 rounded bg-base-100">
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

            <div className="overflow-x-auto md:overflow-hidden">
              <span className="mb-2 block text-sm font-medium">Медиафайлы</span>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <input type="file" id="fileInputImage" onChange={uploadFile} hidden accept="image/*" />
                <input type="file" id="fileInputVideo" onChange={uploadFile} hidden accept="video/*" />
                <input type="file" id="fileInputFile" onChange={uploadFile} hidden accept="application/*" />

                <div className="flex flex-wrap gap-2 items-center">
                  {/* единый стиль кнопок */}
                  <button className="btn btn-soft h-9 px-3 flex items-center gap-2 text-sm" onClick={() => document.getElementById("fileInputImage")?.click()}>
                    <PhotoIcon className="h-4 w-4" />
                    <span>Фото</span>
                  </button>

                  <button className="btn btn-soft h-9 px-3 flex items-center gap-2 text-sm" onClick={openMediaModal}>
                    <PhotoIcon className="h-4 w-4" />
                    <span>Медиатека</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <PhotoIcon className="h-4 w-4 text-base-content/70" />
                    <span className="text-sm mr-1">URL</span>
                    <input 
                      type="text" 
                      className="input input-sm w-40 md:w-64" 
                      onKeyDown={(e) => e.key === "Enter" && (
                        addUrlImage(e.currentTarget.value),
                        e.currentTarget.value = ""
                      )} 
                    />
                  </div>

                  <button className="btn btn-soft h-9 px-3 flex items-center gap-2 text-sm" onClick={() => document.getElementById("fileInputVideo")?.click()}>
                    <FilmIcon className="h-4 w-4" />
                    <span>Видео</span>
                  </button>

                  <button className="btn btn-soft h-9 px-3 flex items-center gap-2 text-sm" onClick={() => document.getElementById("fileInputFile")?.click()}>
                    <DocumentIcon className="h-4 w-4" />
                    <span>Документ</span>
                  </button>
                </div>
              </div>

              <div className="mt-4">
                {(images.length > 0 || video.length > 0 || documents.length > 0 || allFiles.length > 0 ) && (
                  <div className="overflow-x-auto -mx-2 px-2">
                    <MediaRender
                      images={images}
                      video={video}
                      documents={documents}
                      allFiles={allFiles}
                      deleteItems={deleteItems}
                      blocking={blocking}
                    />
                  </div>
                )}
              </div>
            </div>

              <UserSelectBroadcast
                audience={audience}
                setAudience={setAudience}
                setIsModalOpen={setIsModalOpen}
                setSearchQuery={setSearchQuery}
                selectedIds={selectedIds}
              />

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
          <MediaModal
            mediaLoading={mediaLoading}
            mediaList={mediaList}
            setMediaList={setMediaList}
            setMediaModalOpen={setMediaModalOpen}
            addMediaToAttachments={addMediaToAttachments}
            getMediaType={getMediaType}
            mediaDeleting={mediaDeleting}
            deleteMedia={deleteMedia}
          />
        )}
      </div>
    </div>
  );
}