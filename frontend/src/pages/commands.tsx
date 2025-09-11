import { useState } from "react";
import type { CommandType, NewCommandType } from "../interface/types";
import api from "../script/apiFetch";
import { useAppContext } from "../layout/AppLayout";
import { SaveBtn } from "../components/saveBtn";
import HeaderPageTitle from "../components/headerPage";
import EditingCommandModal from "../components/command/editingCommandModal";
import RenderCommands from "../components/command/renderCommands";
import useTitle from "../script/useTitle";


export default function Commands() {
    useTitle("Команды");
    const context = useAppContext();
    const { callToast, data, setData, loading } = context;
    const [newCommand, setNewCommand] = useState<NewCommandType | undefined>({ name: "", description: "", response_text: "" });

    const [editingCommand, setEditingCommand] = useState<CommandType | null>(null);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);

    const [isFetching, setIsFetching] = useState<boolean>(false);

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
            const res = await api.delete(`/api/commands`, { data: { id } });
            if (res.status === 200 || res.status === 204) {
                setData(prev => prev ? ({ ...prev, commands: prev.commands.filter(c => c.id !== id)}) : prev);;
                callToast("success", "Команда удалена", 3000);
            } else {
                setData(prev => prev ? ({ ...prev, commands: prev.commands.filter(c => c.id !== id)}) : prev);;
               
                callToast("info", "Команда удалена локально (API вернул ошибку)", 3000);
            }
        } catch (e) {
            setData(prev => prev ? ({ ...prev, commands: prev.commands.filter(c => c.id !== id)}) : prev);;
            callToast("info", "Удалено локально (не удалось связаться с сервером)", 3000);
        } finally {
            setIsDeleting(false);
            if (editingCommand?.id === id) setEditingCommand(null);
        }
    };

    const toggleEnabled = async (id: number) => {
        if (isFetching) return;
        const cmd = data?.commands.find(c => c.id === id);
        if (!cmd) return;
        setIsFetching(true);
        const updated = { ...cmd, enabled: !cmd.enabled };
        setData(prev => prev ? 
            { ...prev, commands: prev.commands.map(c => c.id === id ? updated : c)}
            : prev);
        try {
            await api.put(`/api/commands/${id}/toggle`, { enabled: updated.enabled });
            callToast("success", `Команда ${updated.enabled ? "включена" : "отключена"}`, 2000);
        } catch {
            setData(prev => prev && { ...prev, commands: prev.commands.map(c => c.id === id ? cmd : c)});
            callToast("error", "Не удалось изменить статус на сервере", 3000);
        } finally {
            setTimeout(() => setIsFetching(false), 500);
        }
    };

    const openEdit = (cmd: CommandType) => {
        setEditingCommand({ ...(cmd as any), buttons: (cmd as any).buttons ? JSON.parse(JSON.stringify((cmd as any).buttons)) : [] } as any);
    };

    return (
        <div className="mx-auto py-8">
            <HeaderPageTitle title="Управление командами" description="Добавляйте и редактируйте команды Telegram-бота." />

            <div className="card bg-base-100 shadow mb-8 mt-12">
             <span className="text-xl font-bold absolute -top-5 pl-3 ">Добавить команду</span>
                <div className={`card-body overflow-hidden transition-all relative duration-1000  ${newCommand?.name ? "max-h-screen" : "max-h-20"}`}>
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
                            className="textarea textarea-primary w-full md:w-1/2 "
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
                        <RenderCommands 
                            commands={data?.commands || []} 
                            toggleEnabled={toggleEnabled}
                            openEdit={openEdit}
                            isDeleting={isDeleting}
                            deleteCommand={deleteCommand}
                            loading={loading}
                        />
                    </tbody>
                </table>
            </div>

            {/* Модальное окно редактирования */}
            {editingCommand && (
                <EditingCommandModal 
                    editingCommand={editingCommand} 
                    setEditingCommand={setEditingCommand}
                    callToast={callToast}
                    setData={setData}
                    deleteCommand={deleteCommand}
                    isDeleting={isDeleting}
                />
            )}
        </div>
    );
}