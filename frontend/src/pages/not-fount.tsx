import React, { useEffect, useState, useRef } from "react";
import { useAppContext } from "../layout/AppLayout";
import HeaderPageTitle from "../components/headerPage";
import useTitle from "../script/useTitle";
// import api from "../script/apiFetch";

export default function NotFound() {
    useTitle("Ошибка");
    const { callToast } = useAppContext();
    const [visible, setVisible] = useState(false);
    const [title, setTitle] = useState("");
    const [details, setDetails] = useState("");
    const [includeConsole, setIncludeConsole] = useState(true);
    const [file, setFile] = useState<File | null>(null);
    const [sending, setSending] = useState(false);
    const mounted = useRef(true);

    useEffect(() => {
        mounted.current = true;
        const t = setTimeout(() => setVisible(true), 80);
        return () => {
        mounted.current = false;
        clearTimeout(t);
        };
    }, []);

    const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files && e.target.files[0];
        if (f) setFile(f);
    };

    const sendReport = async () => {
        if (!title.trim() && !details.trim()) {
        callToast("error", "Заполните заголовок или описание", 3000);
        return;
        }
        setSending(true);
        try {
        // Формируем payload. Если есть файл — отправляем FormData
        if (file) {
            const form = new FormData();
            form.append("title", title);
            form.append("details", details);
            form.append("include_console", String(includeConsole));
            form.append("file", file, file.name);
            // await api.post("/api/bugs", form, { headers: { "Content-Type": "multipart/form-data" } });
        } else {
            // await api.post("/api/bugs", { title, details, include_console: includeConsole });
        }
        if (!mounted.current) return;
        callToast("success", "Отчёт отправлен — спасибо!", 4000);
        setTitle("");
        setDetails("");
        setFile(null);
        } catch (e) {
        callToast("error", "Не удалось отправить отчёт", 4000);
        } finally {
        if (mounted.current) setSending(false);
        }
    };

    return (
        <div className="text-base-content w-full z-10">
        <div className="container mx-auto py-12">
            <HeaderPageTitle title="Ошибка — страница не найдена" />

            <div className={`max-w-3xl mx-auto mt-8 transition-all duration-400 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            <div className="card bg-base-200 p-6 shadow-lg">
                <div className="flex flex-col md:flex-row items-start gap-6">
                <div className="flex-shrink-0 w-full md:w-48 flex items-center justify-center">
                    <div className="w-40 h-40 rounded-full bg-gradient-to-tr from-red-400 via-pink-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-xl">
                    404
                    </div>
                </div>

                <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-1">Страница не найдена</h2>
                    <p className="text-base-content/60 mb-4">Похоже, вы попали на несуществующую страницу. Если это ошибка приложения — сообщите нам, пожалуйста.</p>

                    <div className="mb-4">
                    <label className="label"><span className="label-text">Краткий заголовок (что произошло)</span></label>
                    <input value={title} onChange={(e) => setTitle(e.target.value)} className="input input-bordered w-full" placeholder="Например: Ошибка при сохранении" />
                    </div>

                    <div className="mb-4">
                    <label className="label"><span className="label-text">Подробности / шаги для воспроизведения</span></label>
                    <textarea value={details} onChange={(e) => setDetails(e.target.value)} className="textarea textarea-bordered w-full h-32" placeholder="Опишите, что вы делали и что произошло..." />
                    </div>

                    <div className="mb-4 flex items-center justify-between">
                    <label className="flex items-center gap-3">
                        <input type="checkbox" checked={includeConsole} onChange={(e) => setIncludeConsole(e.target.checked)} className="checkbox" />
                        <span className="text-sm">Включить консольные данные (ошибки снизу)</span>
                    </label>

                    <label className="flex items-center gap-3">
                        <input type="file" onChange={onFile} className="hidden" id="bug-file" />
                        <label htmlFor="bug-file" className="btn btn-ghost btn-sm">Прикрепить файл</label>
                        <div className="text-sm text-base-content/60">{file ? file.name : "Файлы не добавлены"}</div>
                    </label>
                    </div>

                    <div className="flex items-center gap-3">
                    <button className="btn btn-primary" onClick={sendReport} disabled={sending}>{sending ? "Отправка..." : "Отправить отчёт"}</button>
                    <button className="btn" onClick={() => { setTitle(""); setDetails(""); setFile(null); callToast("info", "Форма очищена", 2000); }}>Очистить</button>
                    <a href="/" className="btn btn-ghost">На главную</a>
                    </div>

                    <div className="mt-6 text-sm text-base-content/60">Мы получим отчёт и постараемся решить проблему как можно скорее. Спасибо за помощь в улучшении сервиса.</div>
                </div>
                </div>
            </div>

            <div className="mt-6 text-center text-sm text-base-content/60">
                <div className="inline-block px-3 py-1 bg-base-100 rounded shadow-sm">Отладочная информация</div>
            </div>
            </div>
        </div>
        </div>
    );
}
