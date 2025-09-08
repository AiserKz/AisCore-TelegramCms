import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useState, useRef } from "react";
import type { CommandType, NewCommandType } from "../interface/types";
import api from "../script/apiFetch";
import { useAppContext } from "../layout/AppLayout";
import SkeletonTable from "../components/skeletonTable";
import { SaveBtn } from "../components/saveBtn";


export default function Commands() {
    const context = useAppContext();
    const { callToast, data, setData, loading } = context;
    // const [commands, setCommangs] = useState<CommandType[]>([]);
    const [newCommand, setNewCommand] = useState<NewCommandType | undefined>({ name: "", description: "", response_text: "" });

    // Новое: редактирование
    const [editingCommand, setEditingCommand] = useState<CommandType | null>(null);
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // добавлено:
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);


    const handleCreateCommand = async () => {
        if (!newCommand) return;
        if (newCommand.name.trim() === "" || newCommand.description.trim() === "" || newCommand.response_text.trim() === "") {
            callToast("error", "Поля не должны быть пустыми", 5000);
            return;
        };
        const payload = {
            name: newCommand.name.trim(),
            description: newCommand.description.trim(),
            response_text: newCommand.response_text.trim(),
            enabled: true,
            created_at: new Date().toISOString(),
        };
        try {
            const res = await api.post("/api/commands", payload);
            if (res.status === 201 || res.status === 200) {
                const created: CommandType = res.data || { ...(payload as any), id: Date.now() };
                // setCommangs(prev => [...prev, created]);
                setData(prev =>
                    prev ?
                        { ...prev, commands: [...prev.commands, created]}
                        : prev
                )
                setNewCommand({ name: "", description: "", response_text: "" });
                callToast("success", "Команда создана", 3000);
            } else {
                callToast("error", "Ошибка создания команды", 4000);
            }
        } catch (e) {
            callToast("error", "Ошибка сети при создании", 4000);
        }
    };

    // Удаление команды 
    const deleteCommand = async (id: number) => {
        const ok = confirm("Удалить команду? Это действие нельзя отменить.");
        if (!ok) return;
        setIsDeleting(true);
        try {
            // Заглушка: реальный вызов api.delete(`/api/commands/${id}`)
            const res = await api.delete(`/api/commands`, { data: { id } });
            if (res.status === 200 || res.status === 204) {
                setData(prev => prev ? ({ ...prev, commands: prev.commands.filter(c => c.id !== id)}) : prev);;
                callToast("success", "Команда удалена", 3000);
            } else {
                // если API не поддерживает — удалим локально как fallback
                setData(prev => prev ? ({ ...prev, commands: prev.commands.filter(c => c.id !== id)}) : prev);;
               
                callToast("info", "Команда удалена локально (API вернул ошибку)", 3000);
            }
        } catch (e) {
            // fallback: удаляем локально и показываем предупреждение
            setData(prev => prev ? ({ ...prev, commands: prev.commands.filter(c => c.id !== id)}) : prev);;
            callToast("info", "Удалено локально (не удалось связаться с сервером)", 3000);
        } finally {
            setIsDeleting(false);
            if (editingCommand?.id === id) setEditingCommand(null);
        }
    };

    // Переключение активности 
    const toggleEnabled = async (id: number) => {
        const cmd = data?.commands.find(c => c.id === id);
        if (!cmd) return;
        const updated = { ...cmd, enabled: !cmd.enabled };
        // оптимистично обновляем UI
        setData(prev => prev ? 
            { ...prev, commands: prev.commands.map(c => c.id === id ? updated : c)}
            : prev);
        try {
            await api.put(`/api/commands/${id}/toggle`, { enabled: updated.enabled });
            callToast("success", `Команда ${updated.enabled ? "включена" : "отключена"}`, 2000);
        } catch {
            // откат при ошибке
            // setCommangs(prev => prev.map(c => c.id === id ? cmd : c));
            setData(prev => prev && { ...prev, commands: prev.commands.map(c => c.id === id ? cmd : c)});
            callToast("error", "Не удалось изменить статус на сервере", 3000);
        }
    };

    // Открыть модал редактирования
    const openEdit = (cmd: CommandType) => {
        // клонируем чтобы не мутировать напрямую
        setEditingCommand({ ...(cmd as any), buttons: (cmd as any).buttons ? JSON.parse(JSON.stringify((cmd as any).buttons)) : [] } as any);
    };

    // Вставка текста в текущее место курсора в textarea
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

    // Простейшие обработчики панели
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

    // Управление inline-кнопками
    const addButtonToList = (text: string, url: string) => {
        if (!editingCommand) return;
        const buttons = (editingCommand as any).buttons ? [...(editingCommand as any).buttons] : [];
        buttons.push({ text, url });
        setEditingCommand({ ...editingCommand, buttons });
    };
    const removeButtonFromList = (idx: number) => {
        if (!editingCommand) return;
        const buttons = (editingCommand as any).buttons ? [...(editingCommand as any).buttons] : [];
        buttons.splice(idx, 1);
        setEditingCommand({ ...editingCommand, buttons });
    };

    // Простой рендер markdown -> HTML
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

    // При сохранении команд добавляем buttons в payload 
    const saveEdit = async () => {
        if (!editingCommand) return;
        if (editingCommand.name.trim() === "" || editingCommand.description.trim() === "" || editingCommand.response_text.trim() === "") {
            callToast("error", "Поля не должны быть пустыми", 5000);
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

    const formatDate = (d: string | Date | undefined) => {
        if (!d) return "-";
        const dt = typeof d === "string" ? new Date(d) : d;
        return dt.toLocaleString();
    };

    const renderCommands = () => {
        if (loading) return Array.from({ length: 3 }).map((_, i) => <SkeletonTable key={i} />);
        return data?.commands.map((row) => (
            <tr key={row.id} className={row.enabled ? "" : "opacity-60"} >
                <td>/{row.name}</td>
                <td>
                    <div className="flex items-center gap-2">
                        <div className={row.enabled ? "text-base-content" : "text-base-content/60"}>
                            {row.description}
                        </div>
                    </div>
                </td>
                <td>{formatDate((row as any).created_at || row.created_at)}</td>
                <td>
                    <div className="flex items-center gap-2">
                        <span className={row.enabled ? "badge badge-success" : "badge badge-ghost"}>{row.enabled ? "Включена" : "Отключена"}</span>
                        <input type="checkbox" className="toggle toggle-sm" checked={!!row.enabled} onChange={() => toggleEnabled(row.id)} />
                    </div>
                </td>
                <td className="text-right">
                    <div className="flex items-center justify-end gap-2">
                        <button className="btn btn-ghost btn-sm flex items-center gap-1" onClick={() => openEdit(row)}>
                            <PencilSquareIcon className="h-4 w-4" />
                            <span>Редактировать</span>
                        </button>
                        <button className="btn btn-ghost btn-sm text-red-500 flex items-center gap-1" onClick={() => deleteCommand(row.id)} disabled={isDeleting}>
                            <TrashIcon className="h-4 w-4" />
                            <span>Удалить</span>
                        </button>
                    </div>
                </td>
            </tr>
        ))
    }

    return (
        <div className="mx-auto py-8">
            <div className="navbar bg-base-100 rounded-box mb-8 shadow">
                <div className="flex-1">
                    <span className="text-2xl font-bold">Управление командами</span>
                    <p className="text-base-content/70 mt-2">Добавляйте и редактируйте команды Telegram-бота.</p>
                </div>
            </div>

            <div className="card bg-base-100 shadow mb-8">
                <div className={`card-body overflow-hidden transition-all duration-1000 ${newCommand?.name ? "max-h-screen" : "max-h-20"}`}>
                    <div className="flex flex-col gap-4">
                        <label className="input input-warning flex items-center gap-2 w-full md:w-1/4">
                            <span className="text-base-content/60">Команда: /</span>
                            <input 
                                type="text" 
                                className="grow" 
                                placeholder="Новая команда" 
                                value={newCommand?.name} 
                                onChange={(e) => setNewCommand({ 
                                    name: e.target.value, 
                                    response_text: newCommand?.response_text || "",
                                    description: newCommand?.description || "" 
                                })} />
                        </label>
                        <label htmlFor="" className="input input-info flex items-center gap-2 w-full md:w-1/2 h-15">
                            <span className="text-base-content/60">Описание</span>
                            <input 
                                type="text" 
                                className="grow" 
                                placeholder="Описание команды" 
                                value={newCommand?.description} 
                                onChange={(e) => setNewCommand({ 
                                    name: newCommand?.name || "", 
                                    response_text: newCommand?.response_text || "",
                                    description: e.target.value })} 
                                />
                        </label>
                        <label>Ответ: </label>
                        <textarea 
                            className="textarea textarea-primary textarea- w-1/2"
                            placeholder="Текст ответа" 
                            value={newCommand?.response_text}
                            onChange={(e) => setNewCommand({
                                name: newCommand?.name || "",
                                response_text: e.target.value,
                                description: newCommand?.description || ""
                            })}
                            >
                        </textarea>
                       
                        <button className="btn btn-primary btn-soft" type="button" onClick={handleCreateCommand}>Добавить команду</button>
                    </div>
                    <SaveBtn />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                    <thead>
                        <tr>
                            <th>Команда</th>
                            <th>Описание</th>
                            <th>Создано</th>
                            <th>Статус</th>
                            <th className="text-right">Действия</th>
                        </tr>
                    </thead>
                        
                    <tbody>
                        {renderCommands()}
                    </tbody>
                </table>
               
            </div>

            {/* Модальное окно редактирования */}
            {editingCommand && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 bg-black/40 p-4">
                    <div className="bg-base-100 w-full max-w-4xl p-6 rounded shadow-lg">
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
                                    <button type="button" className="btn btn-sm" onClick={() => {
                                        const t = prompt("Текст кнопки","");
                                        if (!t) return;
                                        const u = prompt("URL кнопки","https://");
                                        if (!u) return;
                                        addButtonToList(t, u);
                                    }}>Добавить кнопку</button>
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
                                        {((editingCommand as any).buttons || []).map((b: any, idx: number) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <a href={b.url} target="_blank" rel="noreferrer" className="btn btn-xs btn-outline">{b.text}</a>
                                                <button className="btn btn-xs btn-ghost text-error" onClick={() => removeButtonFromList(idx)}>✕</button>
                                            </div>
                                        ))}
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
            )}
        </div>
    );
}