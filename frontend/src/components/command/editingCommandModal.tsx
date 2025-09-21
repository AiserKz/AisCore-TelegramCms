import type React from "react";
import type { CommandType, MainDataType } from "../../interface/types";
import { formatDate } from "../../script/helpers";
import { useRef, useState } from "react";
import api from "../../script/apiFetch";

interface EditingCommandModalProps {
    editingCommand: CommandType;
    setEditingCommand: React.Dispatch<React.SetStateAction<CommandType | null>>;
    callToast: (status: "info" | "success" | "error", message: string, duration?: number) => void;
    setData: React.Dispatch<React.SetStateAction<MainDataType | undefined>>;
    deleteCommand: (id: number) => void;
    isDeleting: boolean;
    data?: MainDataType;
}

export default function EditingCommandModal({ editingCommand, setEditingCommand, callToast, deleteCommand, setData, isDeleting, data }: EditingCommandModalProps ) {


    const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    const insertAtCursor = (before: string, after = "") => {
        if (!textareaRef.current || !editingCommand) return;
        const el = textareaRef.current;
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const orig = editingCommand.response_text || "";
        const selected = orig.slice(start, end);
        const newText = orig.slice(0, start) + before + selected + after + orig.slice(end);
        setEditingCommand({ ...editingCommand, response_text: newText });
        // переместим курсор внутрь вставки (приблизительно)
        setTimeout(() => {
            const pos = start + before.length + (selected.length || 0);
            el.focus();
            el.selectionStart = el.selectionEnd = pos;
        }, 0);
    };

    const onBold = () => insertAtCursor("*", "*");
    const onCode = () => insertAtCursor("`", "`");
    const onLink = () => {
        if (!textareaRef.current || !editingCommand) return;
        const el = textareaRef.current;
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const orig = editingCommand.response_text || "";
        const selected = orig.slice(start, end) || "link text";
        const url = prompt("Введите URL для ссылки", "https://");
        if (!url) return;
        const newText = orig.slice(0, start) + `[${selected}](${url})` + orig.slice(end);
        setEditingCommand({ ...editingCommand, response_text: newText });
    };

    const renderMarkdown = (md: string) => {
        if (!md) return "";
        let html = md
            // code blocks
            .replace(/```([\s\S]*?)```/g, (_m, p1) => `<pre><code>${escapeHtml(p1)}</code></pre>`)
            // inline code
            .replace(/`([^`]+)`/g, (_m, p1) => `<code>${escapeHtml(p1)}</code>`)
            // bold
            .replace(/\*([^*]+)\*/g, (_m, p1) => `<strong>${escapeHtml(p1)}</strong>`)
            // links
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, p1, p2) => `<a href="${escapeAttr(p2)}" target="_blank" rel="noreferrer">${escapeHtml(p1)}</a>`)
            // newlines
            .replace(/\n/g, "<br/>");
        return html;
    };

    const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const escapeAttr = (s: string) => s.replace(/"/g, "&quot;");

    const saveEdit = async () => {
        if (!editingCommand) return;
        if (editingCommand.name.trim() === "" || editingCommand.description.trim() === "" || editingCommand.response_text.trim() === "") {
            callToast("error", "Поля не должны быть пустыми", 5000);
            return;
        }
        const duplicate = data?.commands.find(
            c => c.name.toLowerCase() === editingCommand.name.trim().toLowerCase() 
            && c.id !== editingCommand.id
        )
        if (duplicate) {
            callToast("error", "Команда с таким именем уже существует", 5000);
            return;
        }

        setIsSavingEdit(true);
        try {
            // отправляем editingCommand целико
            const res = await api.put(`/api/commands/${editingCommand.id}`, editingCommand);
            if (res.status === 200 || res.status === 204) {
                setData(prev => prev && { ...prev, commands: prev.commands.map(c => c.id === editingCommand.id ? { ...c, ...editingCommand } : c)});
                callToast("success", "Изменения сохранены", 3000);
                setEditingCommand(null);
            } else {
                callToast("error", "Ошибка сохранения", 4000);
            }
        } catch (e) {
            callToast("error", "Ошибка сети при сохранении", 4000);
        } finally {
            setIsSavingEdit(false);
        }
    };  

    // Управление inline-кнопками
    // const addButtonToList = (text: string, url: string) => {
    //     if (!editingCommand) return;
    //     const buttons = (editingCommand as any).buttons ? [...(editingCommand as any).buttons] : [];
    //     buttons.push({ text, url });
    //     setEditingCommand({ ...editingCommand, buttons });
    // };
    // const removeButtonFromList = (idx: number) => {
    //     if (!editingCommand) return;
    //     const buttons = (editingCommand as any).buttons ? [...(editingCommand as any).buttons] : [];
    //     buttons.splice(idx, 1);
    //     setEditingCommand({ ...editingCommand, buttons });
    // };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 bg-black/40 p-4">
            <div className="bg-base-100 w-full max-w-4xl p-6 rounded shadow-lg overflow-y-auto h-full">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="font-bold text-xl">Редактировать команду: /{editingCommand.name}</h3>
                        <div className="text-sm text-base-content/60">Создано: {formatDate(editingCommand.created_at)}</div>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditingCommand(null)}>Закрыть</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block mb-2"><span className="label-text">Команда (без /)</span></label>
                        <input className="input input-bordered w-full" value={editingCommand.name} onChange={(e) => setEditingCommand({...editingCommand, name: e.target.value})} />
                        <p className="text-xs text-base-content/60 mt-1">Имя команды, без ведущего слеша. Используется для триггера.</p>
                    </div>

                    <div>
                        <label className="block mb-2"><span className="label-text">Включена</span></label>
                        <div className="flex items-center gap-4">
                            <input type="checkbox" className="toggle" checked={!!editingCommand.enabled} onChange={(e) => setEditingCommand({...editingCommand, enabled: e.target.checked})} />
                            <span className="text-sm text-base-content/70">Если выключена — команда не будет обрабатываться ботом.</span>
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block mb-2"><span className="label-text">Описание</span></label>
                        <input className="input input-bordered w-full" value={editingCommand.description} onChange={(e) => setEditingCommand({...editingCommand, description: e.target.value})} />
                        <p className="text-xs text-base-content/60 mt-1">Краткое описание того, что делает команда. Показывается в списке.</p>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block mb-2"><span className="label-text">Текст ответа</span></label>
                        <div className="mb-2 flex gap-2">
                            <button type="button" className="btn btn-sm" onClick={onBold}><strong>B</strong></button>
                            <button type="button" className="btn btn-sm" onClick={onCode}><code>{`</>`}</code></button>
                            <button type="button" className="btn btn-sm" onClick={onLink}>Link</button>
                            {/* <button type="button" className="btn btn-sm" onClick={() => {
                                const t = prompt("Текст кнопки","");
                                if (!t) return;
                                const u = prompt("URL кнопки","https://");
                                if (!u) return;
                                addButtonToList(t, u);
                            }}>Добавить кнопку</button> */}
                        </div>
                        <textarea
                            ref={textareaRef}
                            className="textarea textarea-bordered w-full h-40"
                            value={editingCommand.response_text}
                            onChange={(e) => setEditingCommand({...editingCommand, response_text: e.target.value})}
                        />
                        <p className="text-xs text-base-content/60 mt-1">Поддерживается простая Markdown-разметка: <strong>*жирный*</strong>, <code>`код`</code>, [ссылка](https://...)</p>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block mb-2"><span className="label-text">Превью ответа</span></label>
                        <div className="p-3 border rounded bg-base-200">
                            <div
                                className="text-sm mb-4"
                                dangerouslySetInnerHTML={{ __html: renderMarkdown(editingCommand.response_text || "") }}
                            />
                            {/* Telegram-подобные inline-кнопки */}
                            <div className="flex flex-wrap gap-2">
                                {((editingCommand as any).buttons || []).length === 0 && <div className="text-base-content/60">Кнопки не заданы</div>}
                                {/* {((editingCommand as any).buttons || []).map((b: any, idx: number) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <a href={b.url} target="_blank" rel="noreferrer" className="btn btn-xs btn-outline">{b.text}</a>
                                        <button className="btn btn-xs btn-ghost text-error" onClick={() => removeButtonFromList(idx)}>✕</button>
                                    </div>
                                ))} */}
                            </div>
                        </div>
                    </div>

                </div>

                <div className="flex justify-between items-center">
                    <div className="text-sm text-base-content/60">ID: {editingCommand.id}</div>
                    <div className="flex gap-2">
                        <button className="btn btn-error btn-outline" onClick={() => deleteCommand(editingCommand.id)} disabled={isDeleting}>
                            Удалить команду
                        </button>
                        <button className="btn" onClick={() => setEditingCommand(null)}>Отмена</button>
                        <button className="btn btn-primary" onClick={saveEdit} disabled={isSavingEdit}>
                            {isSavingEdit ? "Сохранение..." : "Сохранить"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}